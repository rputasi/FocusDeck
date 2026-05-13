using System;
using System.Diagnostics;
using System.IO;
using System.Linq;

class Program {
    static int Main(string[] args) {
        var dir = Path.GetDirectoryName(typeof(Program).Assembly.Location);
        var real7za = Path.Combine(dir, "7za_real.exe");
        var psi = new ProcessStartInfo(real7za, string.Join(" ", args.Select(a => a.Contains(' ') ? "\"" + a + "\"" : a)));
        psi.UseShellExecute = false;
        psi.RedirectStandardOutput = true;
        psi.RedirectStandardError = true;
        var proc = Process.Start(psi);
        proc.WaitForExit();
        var err = proc.StandardError.ReadToEnd();
        if (proc.ExitCode != 0 && err.Contains("Cannot create symbolic link")) {
            var cacheDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "electron-builder", "Cache", "winCodeSign"
            );
            if (Directory.Exists(cacheDir)) {
                foreach (var d in Directory.GetDirectories(cacheDir)) {
                    var libDir = Path.Combine(d, "darwin", "10.12", "lib");
                    if (Directory.Exists(libDir)) {
                        foreach (var pair in new[] {
                            new[] {"libcrypto.dylib", "libcrypto.1.0.0.dylib"},
                            new[] {"libssl.dylib", "libssl.1.0.0.dylib"}
                        }) {
                            var target = Path.Combine(libDir, pair[0]);
                            var source = Path.Combine(libDir, pair[1]);
                            if (File.Exists(source) && (!File.Exists(target) || new FileInfo(target).Length == 0))
                                File.Copy(source, target, true);
                        }
                    }
                }
            }
            return 0;
        }
        return proc.ExitCode;
    }
}
