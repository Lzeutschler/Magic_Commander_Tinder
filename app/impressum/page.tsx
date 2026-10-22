import type { Metadata } from "next";
import Link from "next/link";

import { Address, ExternalLink, PageHeader, Prose } from "@/components/legal/prose";
import { LEGAL_LAST_UPDATED, OPERATOR } from "@/lib/site";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Impressum / legal notice of Commander Tinder according to § 5 DDG.",
  alternates: { canonical: "/impressum" },
};

const mail = <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>;

function addressLines(lang: "de" | "en") {
  return [OPERATOR.company, OPERATOR.street, `${OPERATOR.postalCode} ${OPERATOR.city}`, OPERATOR.country[lang]];
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
        <h2 id="impressum-de">Angaben gemäß § 5 DDG</h2>
        <Address lines={addressLines("de")} />

        <h3>Vertreten durch</h3>
        <p>Geschäftsführer: {OPERATOR.managingDirector}</p>

        <h3>Kontakt</h3>
        <p>
          E-Mail: {mail}
          <br />
          Website: <ExternalLink href={OPERATOR.website} />
        </p>

        <h3>Registereintrag</h3>
        <p>
          Registergericht: {OPERATOR.registerCourt}
          <br />
          Registernummer: {OPERATOR.registerNumber}
        </p>

        <h3>Umsatzsteuer-Identifikationsnummer</h3>
        <p>USt-IdNr. gemäß § 27a UStG: {OPERATOR.vatId}</p>

        <h3>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h3>
        <p>
          {OPERATOR.contentResponsible}, {OPERATOR.street}, {OPERATOR.postalCode} {OPERATOR.city}
        </p>

        <h2>Über dieses Angebot</h2>
        <p>
          Commander Tinder ist ein kostenloses Fan-Projekt für Spielerinnen und Spieler von Magic: The Gathering
          (Format Commander), entwickelt von <Link href="/about">Leonard Zeutschler</Link>. Es gibt keine
          Nutzerkonten und keine kostenpflichtigen Leistungen.
        </p>

        <h2>Verbraucherstreitbeilegung</h2>
        <p>
          Wir sind weder bereit noch verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle
          teilzunehmen.
        </p>

        <h2>Haftung für Inhalte</h2>
        <p>
          Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen
          verantwortlich. Nach §§ 7 bis 10 DDG sind wir jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde
          Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          Pflichten zur Entfernung oder Sperrung von Informationen nach den allgemeinen Gesetzen bleiben unberührt; eine
          Haftung ist erst ab Kenntnis einer konkreten Rechtsverletzung möglich. Entsprechende Inhalte entfernen wir
          umgehend, sobald wir davon erfahren.
        </p>
        <p>
          Kartendaten und Empfehlungen stammen von Scryfall und EDHREC. Wir bemühen uns um Richtigkeit, übernehmen aber
          keine Gewähr für Vollständigkeit, Aktualität oder Regelkonformität der Vorschläge.
        </p>

        <h2>Haftung für Links</h2>
        <p>
          Diese Website enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. Für die
          Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber verantwortlich. Zum Zeitpunkt der
          Verlinkung waren keine Rechtsverstöße erkennbar. Werden uns Rechtsverletzungen bekannt, entfernen wir den
          betreffenden Link umgehend.
        </p>

        <h2>Urheberrecht und Markenhinweis</h2>
        <p>
          Die von uns erstellten Inhalte und der Quellcode dieser Seiten unterliegen dem deutschen Urheberrecht.
          Kartenbilder, Kartentexte und Mana-Symbole sind Eigentum von Wizards of the Coast LLC und werden über
          Scryfall bereitgestellt.
        </p>
        <p>
          Commander Tinder is unofficial Fan Content permitted under the{" "}
          <ExternalLink href="https://company.wizards.com/en/legal/fancontentpolicy">Fan Content Policy</ExternalLink>
          . Not approved/endorsed by Wizards. Portions of the materials used are property of Wizards of the Coast.
          ©Wizards of the Coast LLC.
        </p>
        <p>
          Sollten Sie auf eine Urheberrechtsverletzung aufmerksam werden, bitten wir um einen Hinweis an {mail}.
        </p>

        <p className="pt-2 text-xs">Stand: {LEGAL_LAST_UPDATED.de}</p>
      </Prose>

      <Prose id="en" lang="en" aria-labelledby="impressum-en">
        <h2 id="impressum-en">Legal notice (English)</h2>
        <p>
          This is a courtesy translation. The German version above is legally binding.
        </p>

        <h3>Information according to § 5 DDG (German Digital Services Act)</h3>
        <Address lines={addressLines("en")} />

        <h3>Represented by</h3>
        <p>Managing Director: {OPERATOR.managingDirector}</p>

        <h3>Contact</h3>
        <p>
          Email: {mail}
          <br />
          Website: <ExternalLink href={OPERATOR.website} />
        </p>

        <h3>Commercial register</h3>
        <p>
          Register court: {OPERATOR.registerCourt}
          <br />
          Registration number: {OPERATOR.registerNumber}
        </p>

        <h3>VAT identification number</h3>
        <p>VAT ID according to § 27a UStG: {OPERATOR.vatId}</p>

        <h3>Responsible for content according to § 18 (2) MStV</h3>
        <p>
          {OPERATOR.contentResponsible}, {OPERATOR.street}, {OPERATOR.postalCode} {OPERATOR.city}
        </p>

        <h2>About this service</h2>
        <p>
          Commander Tinder is a free fan project for Magic: The Gathering Commander players, built by{" "}
          <Link href="/about">Leonard Zeutschler</Link>. There are no user accounts and no paid features.
        </p>

        <h2>Consumer dispute resolution</h2>
        <p>
          We are neither obliged nor willing to participate in dispute resolution proceedings before a consumer
          arbitration board.
        </p>

        <h2>Liability for content and links</h2>
        <p>
          We are responsible for our own content under general law. Under Sections 7 to 10 DDG we are not obliged to
          monitor third-party information that is transmitted or stored, or to look for circumstances indicating illegal
          activity. Once we become aware of a specific legal violation, we remove the content or link immediately. Card
          data and suggestions come from Scryfall and EDHREC; we do not guarantee that they are complete, current or
          legal in every format. Linked third-party websites are the sole responsibility of their operators.
        </p>

        <h2>Copyright and trademarks</h2>
        <p>
          Our own content and source code are protected by German copyright law. Card images, card text and mana
          symbols are property of Wizards of the Coast LLC and are served by Scryfall. Commander Tinder is unofficial Fan
          Content permitted under the Fan Content Policy. Not approved/endorsed by Wizards. If you notice a copyright
          infringement, please let us know at {mail}.
        </p>

        <p className="pt-2 text-xs">Last updated: {LEGAL_LAST_UPDATED.en}</p>
      </Prose>
    </article>
  );
}
