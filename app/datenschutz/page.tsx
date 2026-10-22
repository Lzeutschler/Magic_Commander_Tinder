import type { Metadata } from "next";
import Link from "next/link";

import { Address, ExternalLink, PageHeader, Prose, Todo } from "@/components/legal/prose";
import { LEGAL_LAST_UPDATED, OPERATOR } from "@/lib/site";

export const metadata: Metadata = {
  title: "Datenschutz / Privacy",
  description: "Privacy policy of Commander Tinder: no accounts, no cookies, no tracking — what happens to your data.",
  alternates: { canonical: "/datenschutz" },
};

const mail = <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>;

/** Supervisory authority as named in the 45level privacy policy (operator based in North Rhine-Westphalia). */
const AUTHORITY = [
  "Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen",
  "Kavalleriestraße 2-4",
  "40213 Düsseldorf",
];

const STORAGE_KEY = "commander-tinder";

export default function DatenschutzPage() {
  return (
    <article className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 sm:py-14">
      <PageHeader title="Datenschutzerklärung" lang="de">
        <p lang="de">
          Deutsch ·{" "}
          <a href="#en" className="underline underline-offset-2 hover:text-foreground">
            English version
          </a>
        </p>
      </PageHeader>
      <PrivacyDe />
      <PrivacyEn />
    </article>
  );
}

function PrivacyDe() {
  return (
    <Prose id="de" lang="de" aria-label="Datenschutzerklärung (Deutsch)">
      <h2>Das Wichtigste in Kürze</h2>
      <ul>
        <li>Keine Nutzerkonten, keine Cookies, keine Analyse- oder Tracking-Dienste, keine Werbung.</li>
        <li>Ihre Decks und Swipe-Sitzungen bleiben im lokalen Speicher Ihres Browsers und werden nicht an uns übertragen.</li>
        <li>
          Beim Aufruf der Seite verarbeitet unser Hoster Vercel technisch notwendige Verbindungsdaten. Kartenbilder und
          Mana-Symbole lädt Ihr Browser direkt von Scryfall (USA).
        </li>
      </ul>

      <h2>1. Verantwortlicher</h2>
      <p>Verantwortlich für die Datenverarbeitung auf dieser Website im Sinne der DSGVO ist:</p>
      <Address
        lines={[
          OPERATOR.company,
          `vertreten durch den Geschäftsführer ${OPERATOR.managingDirector}`,
          OPERATOR.street,
          `${OPERATOR.postalCode} ${OPERATOR.city}`,
          OPERATOR.country.de,
        ]}
      />
      <p>
        E-Mail: {mail}
        <br />
        Weitere Angaben finden Sie im <Link href="/impressum">Impressum</Link>.
      </p>

      <h2>2. Rechtsgrundlagen</h2>
      <p>
        Wir verarbeiten personenbezogene Daten auf Grundlage der Datenschutz-Grundverordnung (DSGVO), des
        Bundesdatenschutzgesetzes (BDSG) und des Telekommunikation-Digitale-Dienste-Datenschutz-Gesetzes (TDDDG). Soweit
        nicht anders angegeben, stützen wir die Verarbeitung auf unser berechtigtes Interesse an einem sicheren,
        stabilen und funktionsfähigen Angebot (Art. 6 Abs. 1 lit. f DSGVO).
      </p>

      <h2>3. Hosting und Server-Logfiles (Vercel)</h2>
      <p>
        Diese Website wird bei Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA gehostet. Bei jedem
        Aufruf verarbeitet Vercel automatisch Daten, die Ihr Browser übermittelt: IP-Adresse, Datum und Uhrzeit,
        aufgerufene URL, Referrer, Browsertyp und -version, Betriebssystem sowie übertragene Datenmenge. Das ist
        technisch erforderlich, um die Seite auszuliefern und Angriffe abzuwehren (Art. 6 Abs. 1 lit. f DSGVO).
      </p>
      <p>
        Vercel liefert Inhalte über ein weltweites Netz von Rechenzentren aus; dabei können Daten auch in den USA
        verarbeitet werden. Vercel ist unter dem EU-U.S. Data Privacy Framework zertifiziert, für das ein
        Angemessenheitsbeschluss der EU-Kommission besteht (Art. 45 DSGVO). Die Logdaten werden von Vercel nur für
        begrenzte Zeit vorgehalten. Wir werten sie nicht zu Analysezwecken aus und führen sie nicht mit anderen Daten
        zusammen. Vercel Analytics oder Speed Insights setzen wir nicht ein. Weitere Informationen:{" "}
        <ExternalLink href="https://vercel.com/legal/privacy-policy">Datenschutzerklärung von Vercel</ExternalLink>.
      </p>

      <h2>4. Kartenbilder und Mana-Symbole (Scryfall)</h2>
      <p>
        Kartenbilder werden von <code>cards.scryfall.io</code>, Mana-Symbole von <code>svgs.scryfall.io</code> geladen.
        Diese Dateien ruft Ihr Browser direkt bei Scryfall (USA) ab. Dabei erhält Scryfall Ihre IP-Adresse, die
        Browserkennung und als Referrer die Adresse dieser Website (ohne Pfad). Die Mana-Symbole liefert Scryfall über
        das Content-Delivery-Netz von Cloudflare aus. Cookies werden dabei nach unserer Prüfung nicht gesetzt.
        Rechtsgrundlage ist unser berechtigtes Interesse, Karten so darzustellen, wie Scryfall es für Fan-Projekte vorsieht, ohne die Bilder selbst zu speichern (Art. 6 Abs. 1 lit. f DSGVO).
      </p>
      <p>
        Scryfall war bei unserer Prüfung im Oktober 2026 nicht unter dem EU-U.S. Data Privacy Framework gelistet. Für
        diese Übermittlung in die USA liegt daher kein Angemessenheitsbeschluss vor; US-Behörden könnten auf die Daten
        zugreifen, ohne dass Ihnen dagegen gleichwertige Rechtsbehelfe zustehen. Weitere Informationen:{" "}
        <ExternalLink href="https://scryfall.com/docs/privacy">Datenschutzhinweise von Scryfall</ExternalLink>.
      </p>
      <Todo>
        Rechtsgrundlage für die Drittlandübermittlung an Scryfall prüfen lassen, oder Kartenbilder über den eigenen
        Server ausliefern, damit keine IP-Adressen an Scryfall gehen.
      </Todo>

      <h2>5. Kartendaten und Empfehlungen (Scryfall, EDHREC)</h2>
      <p>
        Die Kartendatenbank laden wir beim Bauen der Website als öffentliche Bulk-Daten von Scryfall herunter.
        Kartenvorschläge fragt unser Server bei EDHREC (edhrec.com) ab, und zwar nur mit dem gewählten Commander,
        Bracket und Thema. Ihre IP-Adresse oder andere Daten über Sie werden dabei nicht an Scryfall oder EDHREC
        übermittelt.
      </p>

      <h2>6. Speicherung im Browser (localStorage)</h2>
      <p>
        Ihre Decks, laufende Swipe-Sitzungen und zugehörige Einstellungen speichern wir im lokalen Speicher
        (localStorage) Ihres Browsers unter dem Schlüssel <code>{STORAGE_KEY}</code>. Diese Daten verlassen Ihr Gerät
        nicht und sind für uns nicht einsehbar. Sie werden nur übertragen, wenn Sie selbst eine Deckliste exportieren
        oder kopieren.
      </p>
      <p>
        Die Speicherung ist unbedingt erforderlich, damit die von Ihnen ausdrücklich gewünschte Funktion (Decks bauen und
        wieder öffnen) bereitgestellt werden kann. Eine Einwilligung ist dafür nicht nötig (§ 25 Abs. 2 Nr. 2 TDDDG);
        Rechtsgrundlage für die weitere Verarbeitung ist Art. 6 Abs. 1 lit. f DSGVO. Sie können die Daten jederzeit
        löschen, indem Sie Decks in der App entfernen oder die Websitedaten in Ihrem Browser löschen.
      </p>

      <h2>7. Keine Cookies, kein Tracking</h2>
      <p>
        Wir setzen keine Cookies und keine Analyse-, Tracking- oder Werbedienste ein und erstellen keine
        Nutzungsprofile. Deshalb zeigen wir auch kein Cookie-Banner: Es gibt nichts, wozu wir Ihre Einwilligung
        einholen müssten.
      </p>

      <h2>8. Schriftarten</h2>
      <p>
        Die verwendeten Schriftarten (Inter, Cinzel) sind lokal auf unserem Server eingebunden. Beim Aufruf der Seite
        wird keine Verbindung zu Google oder anderen Schriftanbietern hergestellt.
      </p>

      <h2>9. Kontakt per E-Mail</h2>
      <p>
        Wenn Sie uns per E-Mail schreiben, verarbeiten wir Ihre Angaben, um Ihre Anfrage zu beantworten (Art. 6 Abs. 1
        lit. f DSGVO). Wir löschen sie, sobald die Anfrage erledigt ist und keine gesetzlichen Aufbewahrungspflichten
        entgegenstehen.
      </p>

      <h2>10. Links zu anderen Websites</h2>
      <p>
        Diese Website verlinkt unter anderem auf Scryfall, EDHREC, LinkedIn und GitHub. Das sind einfache Links: Daten
        werden erst übertragen, wenn Sie einen Link anklicken. Danach gelten die Datenschutzbestimmungen des jeweiligen
        Anbieters.
      </p>

      <h2>11. Ihre Rechte</h2>
      <p>Sie haben gegenüber uns folgende Rechte hinsichtlich der Sie betreffenden personenbezogenen Daten:</p>
      <ul>
        <li>Auskunft (Art. 15 DSGVO)</li>
        <li>Berichtigung (Art. 16 DSGVO)</li>
        <li>Löschung (Art. 17 DSGVO)</li>
        <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
        <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
        <li>
          <strong>Widerspruch</strong> gegen Verarbeitungen auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO aus Gründen, die
          sich aus Ihrer besonderen Situation ergeben (Art. 21 DSGVO)
        </li>
      </ul>
      <p>Wenden Sie sich dazu einfach an {mail}.</p>

      <h3>Beschwerderecht bei einer Aufsichtsbehörde</h3>
      <p>
        Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren (Art. 77 DSGVO), insbesondere in
        dem Mitgliedstaat Ihres Aufenthaltsorts, Arbeitsplatzes oder des mutmaßlichen Verstoßes. Für uns zuständig ist:
      </p>
      <Address lines={AUTHORITY} />
      <p>
        Telefon: +49 211 38424-0 · E-Mail: <a href="mailto:poststelle@ldi.nrw.de">poststelle@ldi.nrw.de</a> · Website:{" "}
        <ExternalLink href="https://www.ldi.nrw.de" />
      </p>

      <h2>12. Datensicherheit</h2>
      <p>
        Die Verbindung zu dieser Website ist per TLS verschlüsselt (erkennbar an „https://“). Zusätzlich schränken
        Sicherheits-Header ein, welche Quellen die Seite laden darf.
      </p>

      <h2>13. Änderungen</h2>
      <p>
        Wir passen diese Datenschutzerklärung an, wenn sich die Website oder die Rechtslage ändert. Es gilt die jeweils
        hier veröffentlichte Fassung.
      </p>
      <p className="pt-2 text-xs">Stand: {LEGAL_LAST_UPDATED.de}</p>
    </Prose>
  );
}

function PrivacyEn() {
  return (
    <Prose id="en" lang="en" aria-label="Privacy policy (English)">
      <h2>Privacy policy (English)</h2>
      <p>This is a courtesy translation. The German version above is legally binding.</p>

      <h3>Summary</h3>
      <ul>
        <li>No user accounts, no cookies, no analytics or tracking services, no ads.</li>
        <li>Your decks and swipe sessions stay in your browser’s local storage and are never sent to us.</li>
        <li>
          Our host Vercel processes technically necessary connection data. Your browser loads card images and mana
          symbols directly from Scryfall (USA).
        </li>
      </ul>

      <h3>1. Controller</h3>
      <p>
        {OPERATOR.company}, represented by its Managing Director {OPERATOR.managingDirector}, {OPERATOR.street},{" "}
        {OPERATOR.postalCode} {OPERATOR.city}, {OPERATOR.country.en}. Email: {mail}. See also the{" "}
        <Link href="/impressum">legal notice</Link>.
      </p>

      <h3>2. Legal basis</h3>
      <p>
        We process personal data under the GDPR, the German BDSG and the TDDDG. Unless stated otherwise, the legal basis
        is our legitimate interest in a secure, stable and working service (Art. 6(1)(f) GDPR).
      </p>

      <h3>3. Hosting and server logs (Vercel)</h3>
      <p>
        This website is hosted by Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA. For every request,
        Vercel processes the data your browser sends: IP address, date and time, requested URL, referrer, browser and
        version, operating system and amount of data transferred. This is necessary to deliver the site and to fend off
        attacks (Art. 6(1)(f) GDPR). Data may be processed in the USA; Vercel is certified under the EU-U.S. Data
        Privacy Framework, which is covered by an adequacy decision (Art. 45 GDPR). Vercel keeps logs only for a limited
        time; we do not analyse them or combine them with other data. We do not use Vercel Analytics or Speed Insights.
        More: <ExternalLink href="https://vercel.com/legal/privacy-policy">Vercel privacy policy</ExternalLink>.
      </p>

      <h3>4. Card images and mana symbols (Scryfall)</h3>
      <p>
        Your browser loads card images from <code>cards.scryfall.io</code> and mana symbols from{" "}
        <code>svgs.scryfall.io</code> directly from Scryfall (USA). Scryfall receives your IP address, your browser’s
        user agent and, as referrer, this website’s address without the path. Mana symbols are delivered through
        Cloudflare’s content delivery network. In our tests no cookies were set for these files. The legal basis is
        our legitimate interest in showing cards the way Scryfall intends for fan projects, without storing the images ourselves (Art. 6(1)(f) GDPR). When we checked in October 2026, Scryfall
        was not listed under the EU-U.S. Data Privacy Framework, so no adequacy decision covers this transfer and US
        authorities could access the data without equivalent legal remedies for you. More:{" "}
        <ExternalLink href="https://scryfall.com/docs/privacy">Scryfall privacy information</ExternalLink>.
      </p>

      <h3>5. Card data and suggestions (Scryfall, EDHREC)</h3>
      <p>
        We download Scryfall’s public bulk data when the site is built. Our server asks EDHREC for card suggestions using
        only the selected commander, bracket and theme. Neither your IP address nor any other data about you is sent to
        Scryfall or EDHREC in the process.
      </p>

      <h3>6. Browser storage (localStorage)</h3>
      <p>
        Your decks, running swipe sessions and related settings are stored in your browser’s localStorage under the key{" "}
        <code>{STORAGE_KEY}</code>. They never leave your device unless you export or copy a deck list yourself, and we
        cannot see them. This storage is strictly necessary for the feature you asked for, so no consent is required (§
        25(2) no. 2 TDDDG); further processing is based on Art. 6(1)(f) GDPR. Delete decks in the app or clear the site
        data in your browser to remove them.
      </p>

      <h3>7. No cookies, no tracking</h3>
      <p>
        We set no cookies and use no analytics, tracking or advertising services, and we do not build user profiles.
        That is why there is no cookie banner: there is nothing we would need your consent for.
      </p>

      <h3>8. Fonts</h3>
      <p>
        The fonts (Inter, Cinzel) are served from our own server. No connection to Google or other font providers is
        made.
      </p>

      <h3>9. Email contact</h3>
      <p>
        If you email us, we use your details to answer your request (Art. 6(1)(f) GDPR) and delete them once it is
        settled, unless statutory retention periods apply.
      </p>

      <h3>10. Links to other websites</h3>
      <p>
        We link to Scryfall, EDHREC, LinkedIn, GitHub and others. These are plain links; data is only transferred once
        you click one, and the privacy policy of that provider applies from then on.
      </p>

      <h3>11. Your rights</h3>
      <p>
        You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction of
        processing (Art. 18), data portability (Art. 20) and the <strong>right to object</strong> to processing based on
        Art. 6(1)(f) GDPR on grounds relating to your particular situation (Art. 21). Just write to {mail}. You also have
        the right to lodge a complaint with a supervisory authority (Art. 77 GDPR); ours is the
        Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen, Kavalleriestraße 2-4, 40213
        Düsseldorf, Germany (<ExternalLink href="https://www.ldi.nrw.de" />).
      </p>

      <h3>12. Security and changes</h3>
      <p>
        Connections are TLS-encrypted, and security headers limit which sources the site may load. We update this policy
        when the website or the law changes; the version published here applies.
      </p>
      <p className="pt-2 text-xs">Last updated: {LEGAL_LAST_UPDATED.en}</p>
    </Prose>
  );
}
