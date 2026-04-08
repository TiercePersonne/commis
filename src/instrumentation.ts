export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    const checks = [
      'which yt-dlp',
      'ls /usr/local/bin/yt-dlp',
      'ls /opt/yt-dlp-env/bin/yt-dlp',
      '/usr/local/bin/yt-dlp --version',
    ];

    for (const cmd of checks) {
      try {
        const [bin, ...args] = cmd.split(' ');
        const { stdout } = await execFileAsync(bin, args, { timeout: 5000 });
        console.log(`[startup] OK: ${cmd} => ${stdout.trim()}`);
      } catch (e: unknown) {
        console.error(`[startup] FAIL: ${cmd} =>`, e instanceof Error ? e.message : e);
      }
    }
  }
}
