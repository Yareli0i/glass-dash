// Glass Dash helper: lets the Glass Dash wallpaper open apps, toggle their windows,
// press media keys and show the Windows account picture.
//
// Wallpaper Engine gives HTML wallpapers no way to launch anything, so the wallpaper asks this
// tiny background program instead. It listens on 127.0.0.1 only, answers just the wallpaper
// (a file:// page, so Origin: null) and runs nothing but the entries of glass-dash-helper.ini
// plus three media keys. The request only picks an id; what an id opens is decided locally.
//
//   glass-dash-helper.exe              run (does nothing if already running)
//   glass-dash-helper.exe --install    start with Windows and start now
//   glass-dash-helper.exe --uninstall  stop starting with Windows and quit
//   glass-dash-helper.exe --list       print app windows (process, class, state) for debugging
//
// Build (C# 5, no SDK needed):
//   C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe /nologo /target:winexe /optimize+
//     /out:glass-dash-helper.exe helper.cs

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Security.Principal;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using Microsoft.Win32;

static class GlassDashHelper
{
    const int Port = 47831;
    const string RunKey = @"Software\Microsoft\Windows\CurrentVersion\Run";
    const string RunName = "GlassDashHelper";

    const string DefaultConfig =
        "; Glass Dash helper: what each wallpaper button does.\r\n" +
        ";\r\n" +
        ";   id = what to open | programs whose windows the button toggles (optional)\r\n" +
        ";\r\n" +
        "; What to open: a protocol link (spotify:), a web link, a path to a program,\r\n" +
        "; or exe-of:<protocol> to start the program registered for that protocol.\r\n" +
        "; With a program list the button works like a dock: it opens the app, brings it to\r\n" +
        "; the front if it is hidden behind other windows, and minimizes it if it was in front.\r\n" +
        "; Changes are picked up automatically.\r\n" +
        "\r\n" +
        "discord  = discord://          | Discord, DiscordPTB, DiscordCanary, Vesktop\r\n" +
        "telegram = exe-of:tg           | Telegram\r\n" +
        "spotify  = spotify:            | Spotify\r\n" +
        "youtube  = https://www.youtube.com/\r\n" +
        "steam    = steam://open/main   | steamwebhelper, steam\r\n" +
        "vscode   = exe-of:vscode       | Code\r\n" +
        "terminal = wt.exe              | WindowsTerminal\r\n";

    static readonly Dictionary<string, byte> MediaKeys = new Dictionary<string, byte>
    {
        { "media-play", 0xB3 }, // VK_MEDIA_PLAY_PAUSE
        { "media-next", 0xB0 }, // VK_MEDIA_NEXT_TRACK
        { "media-prev", 0xB1 }, // VK_MEDIA_PREV_TRACK
    };

    // Shell windows that take focus when the wallpaper (desktop) is clicked.
    static readonly HashSet<string> ShellClasses = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
    {
        "Progman", "WorkerW", "Shell_TrayWnd", "Shell_SecondaryTrayWnd",
    };

    static readonly string ExePath = Process.GetCurrentProcess().MainModule.FileName;
    static readonly string ConfigPath = Path.Combine(Path.GetDirectoryName(ExePath), "glass-dash-helper.ini");
    static readonly string LogPath = Path.Combine(Path.GetTempPath(), "glass-dash-helper.log");

    class ButtonAction
    {
        public string Target;
        public HashSet<string> Processes; // lower-case process names without .exe; may be empty
    }

    static readonly object ConfigLock = new object();
    static Dictionary<string, ButtonAction> actions;
    static DateTime actionsStamp;
    static readonly Queue<DateTime> Recent = new Queue<DateTime>();

    // Last real app window that had focus. Clicking the wallpaper hands focus to the desktop,
    // so this is how the helper knows which app was in front right before the click.
    static IntPtr lastAppWindow = IntPtr.Zero;
    static WinEventProc foregroundCallback; // kept in a field so the GC does not collect it

    static int Main(string[] args)
    {
        string mode = args.Length > 0 ? args[0].ToLowerInvariant() : "";
        if (mode == "--install")
        {
            SetAutostart(true);
            Process.Start(ExePath);
            return 0;
        }
        if (mode == "--uninstall")
        {
            SetAutostart(false);
            StopOtherInstances();
            return 0;
        }
        if (mode == "--list")
        {
            PrintWindows();
            return 0;
        }

        bool firstInstance;
        using (new Mutex(true, @"Local\GlassDashHelper", out firstInstance))
        {
            if (!firstInstance) return 0;
            if (!File.Exists(ConfigPath)) File.WriteAllText(ConfigPath, DefaultConfig, new UTF8Encoding(false));
            TrackForeground();
            Serve();
        }
        return 0;
    }

    /* ---------- HTTP ---------- */

    static void Serve()
    {
        TcpListener listener = new TcpListener(IPAddress.Loopback, Port);
        try
        {
            listener.Start();
        }
        catch (SocketException e)
        {
            Log("cannot listen on port " + Port + ": " + e.Message);
            return;
        }
        while (true)
        {
            TcpClient client = listener.AcceptTcpClient();
            ThreadPool.QueueUserWorkItem(delegate { Handle(client); });
        }
    }

    static void Handle(TcpClient client)
    {
        using (client)
        {
            try
            {
                client.ReceiveTimeout = 3000;
                NetworkStream stream = client.GetStream();
                string head = ReadHead(stream);
                if (head == null) return;

                string[] lines = head.Split(new[] { "\r\n" }, StringSplitOptions.None);
                string[] request = lines[0].Split(' ');
                if (request.Length < 2) return;
                string method = request[0];
                string path = request[1];

                Dictionary<string, string> headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                for (int i = 1; i < lines.Length; i++)
                {
                    int colon = lines[i].IndexOf(':');
                    if (colon > 0) headers[lines[i].Substring(0, colon).Trim()] = lines[i].Substring(colon + 1).Trim();
                }

                string host;
                string origin;
                headers.TryGetValue("Host", out host);
                headers.TryGetValue("Origin", out origin);

                // Host check stops DNS-rebinding tricks; Origin check stops ordinary websites.
                if (host != "127.0.0.1:" + Port && host != "localhost:" + Port)
                {
                    Log("rejected host " + host);
                    Reply(stream, 403);
                    return;
                }
                if (origin != null && origin != "null")
                {
                    Log("rejected origin " + origin);
                    Reply(stream, 403);
                    return;
                }

                if (method == "OPTIONS") Reply(stream, 204);
                else if (method == "GET" && path == "/ping") Reply(stream, 200);
                else if (method == "GET" && path == "/avatar") ServeAvatar(stream);
                else if (method == "POST" && path.StartsWith("/do/")) Reply(stream, Run(path.Substring(4)));
                else Reply(stream, 404);
            }
            catch (Exception e)
            {
                Log("request failed: " + e.Message);
            }
        }
    }

    static string ReadHead(NetworkStream stream)
    {
        byte[] buffer = new byte[8192];
        int length = 0;
        while (length < buffer.Length)
        {
            int read = stream.Read(buffer, length, buffer.Length - length);
            if (read <= 0) return null;
            length += read;
            string text = Encoding.ASCII.GetString(buffer, 0, length);
            int end = text.IndexOf("\r\n\r\n", StringComparison.Ordinal);
            if (end >= 0) return text.Substring(0, end);
        }
        return null;
    }

    static void Reply(NetworkStream stream, int code)
    {
        Reply(stream, code, null, null, true);
    }

    // cors=false leaves out Access-Control-Allow-Origin: the wallpaper can still show the body as
    // an <img>, but no web page can read the bytes (used for the account picture).
    static void Reply(NetworkStream stream, int code, byte[] body, string contentType, bool cors)
    {
        string status;
        switch (code)
        {
            case 200: status = "OK"; break;
            case 204: status = "No Content"; break;
            case 403: status = "Forbidden"; break;
            case 429: status = "Too Many Requests"; break;
            case 500: status = "Internal Server Error"; break;
            default: status = "Not Found"; break;
        }
        StringBuilder head = new StringBuilder();
        head.Append("HTTP/1.1 ").Append(code).Append(' ').Append(status).Append("\r\n");
        if (cors)
        {
            head.Append("Access-Control-Allow-Origin: *\r\n");
            head.Append("Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n");
            head.Append("Access-Control-Allow-Private-Network: true\r\n");
        }
        if (contentType != null) head.Append("Content-Type: ").Append(contentType).Append("\r\n");
        if (body != null) head.Append("Cache-Control: max-age=3600\r\n");
        head.Append("Content-Length: ").Append(body == null ? 0 : body.Length).Append("\r\n");
        head.Append("Connection: close\r\n\r\n");

        byte[] bytes = Encoding.ASCII.GetBytes(head.ToString());
        stream.Write(bytes, 0, bytes.Length);
        if (body != null) stream.Write(body, 0, body.Length);
    }

    static void ServeAvatar(NetworkStream stream)
    {
        string path = AccountPicturePath();
        if (path == null)
        {
            Reply(stream, 404, null, null, false);
            return;
        }
        string type = path.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ? "image/png" : "image/jpeg";
        Reply(stream, 200, File.ReadAllBytes(path), type, false);
    }

    static string AccountPicturePath()
    {
        string sid = WindowsIdentity.GetCurrent().User.Value;
        using (RegistryKey key = Registry.LocalMachine.OpenSubKey(
            @"SOFTWARE\Microsoft\Windows\CurrentVersion\AccountPicture\Users\" + sid))
        {
            if (key == null) return null;
            foreach (string name in new[] { "Image448", "Image424", "Image240", "Image208", "Image192", "Image1080" })
            {
                string path = key.GetValue(name) as string;
                if (!string.IsNullOrEmpty(path) && File.Exists(path)) return path;
            }
        }
        return null;
    }

    /* ---------- actions ---------- */

    static int Run(string id)
    {
        if (!Regex.IsMatch(id, "^[a-z0-9-]{1,32}$")) return 404;

        lock (Recent)
        {
            DateTime now = DateTime.UtcNow;
            while (Recent.Count > 0 && (now - Recent.Peek()).TotalSeconds > 2) Recent.Dequeue();
            if (Recent.Count >= 6) return 429;
            Recent.Enqueue(now);
        }

        byte key;
        if (MediaKeys.TryGetValue(id, out key))
        {
            keybd_event(key, 0, 0, UIntPtr.Zero);
            keybd_event(key, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
            return 200;
        }

        ButtonAction action;
        if (!LoadActions().TryGetValue(id, out action)) return 404;
        if (action.Processes.Count > 0 && Toggle(action.Processes)) return 200;
        return Launch(action.Target) ? 200 : 500;
    }

    // Dock behaviour. Returns false when the app has no window yet, so the caller launches it.
    static bool Toggle(HashSet<string> processes)
    {
        List<IntPtr> windows = FindAppWindows(processes);
        if (windows.Count == 0) return false;

        IntPtr last = lastAppWindow;
        if (windows.Contains(last) && !IsIconic(last))
        {
            foreach (IntPtr w in windows)
            {
                if (!IsIconic(w)) ShowWindow(w, SW_MINIMIZE);
            }
            return true;
        }

        IntPtr top = windows[0]; // EnumWindows goes top to bottom in Z-order
        if (IsIconic(top)) ShowWindow(top, SW_RESTORE);
        GrantForeground();
        SetForegroundWindow(top);
        return true;
    }

    static bool Launch(string target)
    {
        if (target.StartsWith("exe-of:", StringComparison.OrdinalIgnoreCase))
        {
            string protocol = target.Substring(7);
            target = ExeOfProtocol(protocol) ?? protocol + "://";
        }
        try
        {
            GrantForeground(); // lets the new window come to the front instead of just flashing
            Process.Start(new ProcessStartInfo(target) { UseShellExecute = true });
            return true;
        }
        catch (Exception e)
        {
            Log("cannot open " + target + ": " + e.Message);
            return false;
        }
    }

    // Windows only lets the process that received the last input take the foreground.
    // A synthetic Alt tap counts as input (the desktop has focus after a wallpaper click, so
    // it has no visible effect), and AllowSetForegroundWindow passes that right on.
    static void GrantForeground()
    {
        keybd_event(VK_MENU, 0, 0, UIntPtr.Zero);
        keybd_event(VK_MENU, 0, KEYEVENTF_KEYUP, UIntPtr.Zero);
        AllowSetForegroundWindow(ASFW_ANY);
    }

    // "C:\...\Telegram.exe" -- "%1"  ->  C:\...\Telegram.exe
    static string ExeOfProtocol(string protocol)
    {
        using (RegistryKey key = Registry.ClassesRoot.OpenSubKey(protocol + @"\shell\open\command"))
        {
            string command = key == null ? null : key.GetValue("") as string;
            if (string.IsNullOrEmpty(command)) return null;
            Match m = Regex.Match(command, "^\\s*\"([^\"]+)\"|^\\s*(\\S+)");
            string exe = m.Groups[1].Success ? m.Groups[1].Value : m.Groups[2].Value;
            return File.Exists(exe) ? exe : null;
        }
    }

    static Dictionary<string, ButtonAction> LoadActions()
    {
        lock (ConfigLock)
        {
            DateTime stamp = File.Exists(ConfigPath) ? File.GetLastWriteTimeUtc(ConfigPath) : DateTime.MinValue;
            if (actions != null && stamp == actionsStamp) return actions;

            string[] lines = stamp == DateTime.MinValue
                ? DefaultConfig.Split('\n')
                : File.ReadAllLines(ConfigPath, Encoding.UTF8);
            Dictionary<string, ButtonAction> map = new Dictionary<string, ButtonAction>(StringComparer.OrdinalIgnoreCase);
            foreach (string raw in lines)
            {
                string line = raw.Trim();
                if (line.Length == 0 || line[0] == ';' || line[0] == '#') continue;
                int eq = line.IndexOf('=');
                if (eq <= 0) continue;

                string value = line.Substring(eq + 1);
                int bar = value.IndexOf('|');
                ButtonAction action = new ButtonAction
                {
                    Target = (bar < 0 ? value : value.Substring(0, bar)).Trim(),
                    Processes = new HashSet<string>(StringComparer.OrdinalIgnoreCase),
                };
                if (bar >= 0)
                {
                    foreach (string name in value.Substring(bar + 1).Split(','))
                    {
                        string n = name.Trim();
                        if (n.EndsWith(".exe", StringComparison.OrdinalIgnoreCase)) n = n.Substring(0, n.Length - 4);
                        if (n.Length > 0) action.Processes.Add(n);
                    }
                }
                map[line.Substring(0, eq).Trim()] = action;
            }
            actions = map;
            actionsStamp = stamp;
            return map;
        }
    }

    /* ---------- windows ---------- */

    static void TrackForeground()
    {
        Thread thread = new Thread(delegate ()
        {
            foregroundCallback = delegate (IntPtr hook, uint evt, IntPtr hwnd, int obj, int child, uint tid, uint time)
            {
                if (IsAppWindow(hwnd)) lastAppWindow = hwnd;
            };
            SetWinEventHook(EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND, IntPtr.Zero,
                foregroundCallback, 0, 0, WINEVENT_OUTOFCONTEXT);
            MSG msg;
            while (GetMessage(out msg, IntPtr.Zero, 0, 0) > 0) { }
        });
        thread.IsBackground = true;
        thread.Start();
    }

    // Top-level windows the user would see in Alt+Tab.
    static bool IsAppWindow(IntPtr hwnd)
    {
        if (hwnd == IntPtr.Zero || !IsWindowVisible(hwnd)) return false;
        if (GetWindow(hwnd, GW_OWNER) != IntPtr.Zero) return false;
        if ((GetWindowLong(hwnd, GWL_EXSTYLE) & WS_EX_TOOLWINDOW) != 0) return false;
        if (GetWindowTextLength(hwnd) == 0) return false;
        int cloaked;
        if (DwmGetWindowAttribute(hwnd, DWMWA_CLOAKED, out cloaked, 4) == 0 && cloaked != 0) return false;
        return !ShellClasses.Contains(ClassOf(hwnd));
    }

    static List<IntPtr> FindAppWindows(HashSet<string> processes)
    {
        List<IntPtr> found = new List<IntPtr>();
        EnumWindows(delegate (IntPtr hwnd, IntPtr unused)
        {
            if (IsAppWindow(hwnd) && processes.Contains(ProcessOf(hwnd))) found.Add(hwnd);
            return true;
        }, IntPtr.Zero);
        return found;
    }

    static string ProcessOf(IntPtr hwnd)
    {
        uint pid;
        GetWindowThreadProcessId(hwnd, out pid);
        try
        {
            return Process.GetProcessById((int)pid).ProcessName;
        }
        catch (Exception)
        {
            return "";
        }
    }

    static string ClassOf(IntPtr hwnd)
    {
        StringBuilder sb = new StringBuilder(256);
        GetClassName(hwnd, sb, sb.Capacity);
        return sb.ToString();
    }

    static void PrintWindows()
    {
        EnumWindows(delegate (IntPtr hwnd, IntPtr unused)
        {
            if (IsAppWindow(hwnd))
            {
                Console.WriteLine("{0,-24} {1,-40} {2}", ProcessOf(hwnd), ClassOf(hwnd), IsIconic(hwnd) ? "minimized" : "open");
            }
            return true;
        }, IntPtr.Zero);
    }

    /* ---------- misc ---------- */

    static void SetAutostart(bool enable)
    {
        using (RegistryKey key = Registry.CurrentUser.CreateSubKey(RunKey))
        {
            if (enable) key.SetValue(RunName, "\"" + ExePath + "\"");
            else key.DeleteValue(RunName, false);
        }
    }

    static void StopOtherInstances()
    {
        Process me = Process.GetCurrentProcess();
        foreach (Process p in Process.GetProcessesByName(me.ProcessName))
        {
            if (p.Id == me.Id) continue;
            try { p.Kill(); } catch (Exception) { }
        }
    }

    static void Log(string message)
    {
        try
        {
            if (File.Exists(LogPath) && new FileInfo(LogPath).Length > 100000) File.Delete(LogPath);
            File.AppendAllText(LogPath, DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "  " + message + "\r\n");
        }
        catch (Exception) { }
    }

    /* ---------- Win32 ---------- */

    const uint KEYEVENTF_KEYUP = 2;
    const byte VK_MENU = 0x12;
    const int ASFW_ANY = -1;
    const int SW_MINIMIZE = 6;
    const int SW_RESTORE = 9;
    const uint GW_OWNER = 4;
    const int GWL_EXSTYLE = -20;
    const int WS_EX_TOOLWINDOW = 0x80;
    const int DWMWA_CLOAKED = 14;
    const uint EVENT_SYSTEM_FOREGROUND = 3;
    const uint WINEVENT_OUTOFCONTEXT = 0;

    delegate bool EnumWindowsProc(IntPtr hwnd, IntPtr lParam);
    delegate void WinEventProc(IntPtr hook, uint evt, IntPtr hwnd, int idObject, int idChild, uint thread, uint time);

    [StructLayout(LayoutKind.Sequential)]
    struct MSG
    {
        public IntPtr hwnd;
        public uint message;
        public IntPtr wParam;
        public IntPtr lParam;
        public uint time;
        public int x;
        public int y;
    }

    [DllImport("user32.dll")] static extern void keybd_event(byte vk, byte scan, uint flags, UIntPtr extra);
    [DllImport("user32.dll")] static extern bool AllowSetForegroundWindow(int processId);
    [DllImport("user32.dll")] static extern bool SetForegroundWindow(IntPtr hwnd);
    [DllImport("user32.dll")] static extern bool ShowWindow(IntPtr hwnd, int cmd);
    [DllImport("user32.dll")] static extern bool IsIconic(IntPtr hwnd);
    [DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr hwnd);
    [DllImport("user32.dll")] static extern IntPtr GetWindow(IntPtr hwnd, uint cmd);
    [DllImport("user32.dll")] static extern int GetWindowLong(IntPtr hwnd, int index);
    [DllImport("user32.dll")] static extern int GetWindowTextLength(IntPtr hwnd);
    [DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr hwnd, StringBuilder name, int max);
    [DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hwnd, out uint processId);
    [DllImport("user32.dll")] static extern bool EnumWindows(EnumWindowsProc callback, IntPtr lParam);
    [DllImport("user32.dll")] static extern IntPtr SetWinEventHook(uint eventMin, uint eventMax, IntPtr module,
        WinEventProc callback, uint processId, uint threadId, uint flags);
    [DllImport("user32.dll")] static extern int GetMessage(out MSG msg, IntPtr hwnd, uint filterMin, uint filterMax);
    [DllImport("dwmapi.dll")] static extern int DwmGetWindowAttribute(IntPtr hwnd, int attribute, out int value, int size);
}
