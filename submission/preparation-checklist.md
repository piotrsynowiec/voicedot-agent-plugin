# Przygotowanie zgłoszenia VoiceDot

Stan: 30 września 2026. **Zgłoszenie i publikacja wstrzymane decyzją Piotra.**
Pakiet 0.2.0 jest kandydatem; nie zawiera tworzenia projektów przez MCP.

Podstawa procesu: [instrukcja OpenAI](https://developers.openai.com/plugins/deploy/submission).
Wymagane są sprawdzone materiały recenzji, działający dostęp testowy, nagranie,
ukończone kontrole pakietu i narzędzi oraz końcowe oświadczenia właściciela.
Przyjęcie do recenzji i publikacja po akceptacji są osobnymi krokami.

## Zapisane decyzje

- Wydawca: Good Sheet Sp z o.o., zgodnie z nazwą zweryfikowanej tożsamości.
- Kraje: wszystkie dostępne; brak zakupów lub płatności przez narzędzia pluginu.
- Zakres: odczyt, opcjonalne zamykanie/otwieranie pinów, rozwiązywanie dyskusji,
  odpowiedzi po podglądzie i osobnym potwierdzeniu; dodatkowo planowane
  tworzenie projektów i instalacja widgetu przez agenta.
- Testy i film: angielski Atlas Checkout.
- Nie wysyłać zgłoszenia przed zakończeniem nowego przepływu MCP.

## Stan materiałów i odpowiedzialność

| Element | Stan | Kolejny krok |
|---|---|---|
| Wydawca, kraje, brak zakupów | Zapisane w aktualnym pakiecie | Codex sprawdzi import po finalnym przygotowaniu |
| Opis i trzy prompty startowe | Gotowe dla istniejących narzędzi | Codex uzupełni po wdrożeniu tworzenia projektów |
| Ikona | Rzeczywisty PNG 512 × 512, w pakiecie | Codex sprawdzi finalny import |
| Cztery adresy publiczne | Obecna strona sprawdzona | Codex zweryfikuje ponownie przed finalnym pakietem |
| Nowa strona voicedot-site | Dokumenty są szkicami, ujawnienie MCP niepełne | Uzupełnienie i osobny odbiór przed podmianą strony |
| Odczyt i zapis feedbacku | Backend wdrożony | Faktyczne scenariusze w kliencie recenzenta |
| Tworzenie projektów przez MCP | Niezaimplementowane | Ustalenie zakresu pustego konta, implementacja i testy |
| Instalacja snippetem | Istnieje generator w backendzie | Agent ma dostać prawdziwy snippet i sprawdzić instalację |
| Uprawnienia OAuth | Obecne dwa uprawnienia zapisu działają | Osobna zgoda na tworzenie; bez automatycznej zmiany starych grantów |
| Recenzent | Istniejący odczyt i zapis zalogowany przez OAuth | Nowy scenariusz tworzenia wymaga działającego, izolowanego dostępu testowego |
| Pięć scenariuszy pozytywnych i trzy negatywne | Draft dla istniejących narzędzi | Codex dostosuje i przejdzie je na końcowej wersji |
| Film | Nienagrany | Ty nagrywasz po próbie przygotowanej przez Codex |
| URL filmu | Brak | Ty podajesz rzeczywisty link; Codex sprawdza dostęp i wpisuje go do manifestu |
| Notatki wydania | Draft dla istniejących narzędzi | Codex uzupełni o potwierdzone tworzenie i instalację |
| ZIP i metadane | Obecny kandydat zwalidowany | Codex odbuduje, sprawdzi zawartość i zamrozi końcowe SHA |
| Domena i skany OpenAI | Nieukończone | Codex pomoże dokończyć konfigurację finalnego szkicu |
| Dane recenzenta w formularzu | Wyłącznie pola chronione | Ty uzupełniasz; bez haseł w repo, ZIP lub opisie publicznym |
| Oświadczenia i wysłanie | Wstrzymane | Ty po ukończeniu funkcji i sprawdzeniu kompletności |

## Adresy do finalnego formularza

- Witryna: https://voicedot.ai/en/mcp
- Wsparcie: https://voicedot.ai/en/support
- Prywatność: https://voicedot.ai/en/privacy
- Regulamin: https://voicedot.ai/en/terms
- MCP: https://mcp.voicedot.ai/mcp, z OAuth.

Po podmianie witryny trzeba sprawdzić rzeczywiste trasy i treść wszystkich
czterech stron. Sam kod 200 nie potwierdza poprawności dokumentu.

## Nowy przepływ — obserwacje z kodu

Backend ma wspólną usługę dodawania projektów i kontrolę planu. Dodatkowe
projekty wymagają Pro, Team lub aktywnego triala; usługa uwzględnia także
zaplanowany downgrade. Snippet generuje istniejąca usługa konfiguracji widgetu.
MCP powinien ją wykorzystać z prawdziwym adresem publicznego widgetu.

MCP tworzy zasób i zwraca konfigurację. Agent korzysta ze swoich narzędzi
edycji repozytorium, aby dodać snippet. Sukces stworzenia projektu, zapis
kodu, uruchomienie strony i wykrycie instalacji to odrębne wyniki — nie wolno
zgłaszać instalacji wyłącznie na podstawie zwrócenia tekstu snippetu.

Do testów: brak uprawnienia, nieodpowiedni plan, downgrade, obcy workspace,
nieprawidłowy adres, powtórzenie żądania i dostęp tylko do utworzonego projektu.
Obecny recenzent jest ograniczony do ścisłego grafu syntetycznych projektów;
nie wolno po prostu rozszerzyć go na dowolne tworzone zasoby.

## Warunek przygotowania filmu

Końcowy przepływ ma działać w rzeczywistym kliencie na izolowanych danych,
a każdy przypadek ma mieć zapisany wynik. Dopiero wtedy plan filmu jest gotowy
do nagrania. Skrypt, zrzuty i sam sukces OAuth nie są nagraniem ani pełnym testem.
