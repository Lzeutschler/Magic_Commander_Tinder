import type { Metadata } from "next";
import Link from "next/link";

import { Address, ExternalLink, PageHeader, Prose } from "@/components/legal/prose";
import { canonical } from "@/lib/metadata";
import { LEGAL_LAST_UPDATED, OPERATOR, SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Impressum",
  description: `Impressum / legal notice of ${SITE.name}, a private non-commercial fan project.`,
  ...canonical("/impressum"),
};

const mail = <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>;

function addressLines(lang: "de" | "en") {
  return [OPERATOR.name, OPERATOR.street, `${OPERATOR.postalCode} ${OPERATOR.city}`, OPERATOR.country[lang]];
}

export default function ImpressumPage() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:py-14">
      <PageHeader title="Impressum" lang="de">
        <p lang="de">
          Deutsch ·{" "}
          <a href="#en" className="underline underline-offset-2 hover:text-foreground">
            English version
          </a>
        </p>
      </PageHeader>

      <Prose id="de" lang="de" aria-labelledby="impressum-de">
        <h2 id="impressum-de">Anbieter</h2>
        <p>Angaben gemäß § 5 DDG und § 18 Abs. 1 MStV:</p>
        <Address lines={addressLines("de")} />

        <h3>Kontakt</h3>
        <p>E-Mail: {mail}</p>

        <h2>Privates Hobbyprojekt</h2>
        <p>
          {SITE.name} ist ein privates, nicht-kommerzielles Fan-Projekt von{" "}
          <Link href="/about">Leonard Zeutschler</Link> für Spielerinnen und Spieler von Magic: The Gathering (Format
          Commander). Die Nutzung ist kostenlos. Es gibt keine Werbung, keine Nutzerkonten, keine kostenpflichtigen
          Angebote und keine Einnahmen.
        </p>

        <h2>Haftung für Inhalte und Links</h2>
        <p>
          Ich erstelle die Inhalte dieser Seite mit Sorgfalt, übernehme aber keine Gewähr für Vollständigkeit und
          Aktualität. Kartendaten und Kartenvorschläge stammen von Scryfall und EDHREC. Für die Inhalte verlinkter
          externer Websites sind ausschließlich deren Betreiber verantwortlich. Wird mir ein Rechtsverstoß bekannt,
          entferne ich den betreffenden Inhalt oder Link umgehend.
        </p>

        <h2>Urheberrecht und Markenhinweis</h2>
        <p>
          Kartenbilder, Kartentexte und Mana-Symbole sind Eigentum von Wizards of the Coast LLC und werden über
          Scryfall bereitgestellt.
        </p>
        <p>
          {SITE.name} is unofficial Fan Content permitted under the{" "}
          <ExternalLink href="https://company.wizards.com/en/legal/fancontentpolicy">Fan Content Policy</ExternalLink>
          . Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast.
          ©Wizards of the Coast LLC.
        </p>
        <p>Hinweise auf mögliche Urheberrechtsverletzungen bitte an {mail}.</p>

        <p className="pt-2 text-xs">Stand: {LEGAL_LAST_UPDATED.de}</p>
      </Prose>

      <Prose id="en" lang="en" aria-labelledby="impressum-en">
        <h2 id="impressum-en">Legal notice (English)</h2>
        <p>This is a courtesy translation. The German version above is legally binding.</p>

        <h3>Provider (§ 5 DDG, § 18 (1) MStV)</h3>
        <Address lines={addressLines("en")} />

        <h3>Contact</h3>
        <p>Email: {mail}</p>

        <h2>Private hobby project</h2>
        <p>
          {SITE.name} is a private, non-commercial fan project by <Link href="/about">Leonard Zeutschler</Link>{" "}
          for Magic: The Gathering Commander players. It is free to use. There are no ads, no user accounts, no paid
          features and no revenue.
        </p>

        <h2>Liability for content and links</h2>
        <p>
          I create the content with care but cannot guarantee that it is complete or up to date. Card data and
          suggestions come from Scryfall and EDHREC. Linked third-party websites are the sole responsibility of their
          operators. If I learn of a legal violation, I remove the content or link right away.
        </p>

        <h2>Copyright and trademarks</h2>
        <p>
          Card images, card text and mana symbols are property of Wizards of the Coast LLC and are served by Scryfall.
          {SITE.name} is unofficial Fan Content permitted under the Fan Content Policy. Not approved/endorsed by
          Wizards. If you notice a copyright infringement, please let me know at {mail}.
        </p>

        <p className="pt-2 text-xs">Last updated: {LEGAL_LAST_UPDATED.en}</p>
      </Prose>
    </article>
  );
}
