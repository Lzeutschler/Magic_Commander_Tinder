export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-ink py-6 text-xs leading-relaxed text-muted-foreground">
      <div className="mx-auto max-w-6xl space-y-2 px-4">
        <p>
          Card data and images by{" "}
          <a href="https://scryfall.com" className="underline hover:text-foreground" target="_blank" rel="noreferrer">
            Scryfall
          </a>
          . Recommendations based on data from{" "}
          <a href="https://edhrec.com" className="underline hover:text-foreground" target="_blank" rel="noreferrer">
            EDHREC
          </a>
          . Symbol font{" "}
          <a href="https://mana.andrewgioia.com" className="underline hover:text-foreground" target="_blank" rel="noreferrer">
            Mana
          </a>{" "}
          by Andrew Gioia, icons by{" "}
          <a href="https://phosphoricons.com" className="underline hover:text-foreground" target="_blank" rel="noreferrer">
            Phosphor
          </a>
          .
        </p>
        <p>
          Commander Tinder is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by
          Wizards. Portions of the materials used are property of Wizards of the Coast. ©Wizards of the Coast LLC.
        </p>
      </div>
    </footer>
  );
}
