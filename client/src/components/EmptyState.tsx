export function EmptyState() {
  return (
    <div className="empty-state">
      <h2>Add your CurseForge API key to get started</h2>
      <p>
        This app browses real Minecraft Bedrock add-ons and maps through CurseForge's official
        API. It doesn't come with a shared key, so you'll need a free one of your own:
      </p>
      <ol>
        <li>
          Go to{" "}
          <a href="https://console.curseforge.com/" target="_blank" rel="noopener noreferrer">
            console.curseforge.com
          </a>{" "}
          and sign up (it's free).
        </li>
        <li>Create an API key under "API Keys".</li>
        <li>
          Open <code>server/.env</code> (copy it from <code>server/.env.example</code> if it
          doesn't exist yet) and set:
          <pre>CURSEFORGE_API_KEY=your-key-here</pre>
        </li>
        <li>Restart the server. This screen will be replaced by real add-ons and maps.</li>
      </ol>
      <p className="empty-state__note">
        Why not skip the key? Modrinth's public API only hosts Java Edition content — no Bedrock
        add-ons or maps exist there at all — and Planet Minecraft has no public API, so
        CurseForge is the only source that can actually power real search and one-tap downloads
        here.
      </p>
    </div>
  );
}
