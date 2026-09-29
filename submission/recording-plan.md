# Plan nagrania — VoiceDot w Codex

**Draft; nagrywaj po wdrożeniu i próbie tworzenia projektów przez MCP.**
Ten plik nie jest nagraniem ani dowodem przejścia scenariuszy.

## Przed nagraniem — przygotowuje Codex

- Końcowy backend, zgodny pakiet pluginu i właściwe narzędzia klienta.
- Wyłącznie izolowane dane recenzenta; angielski Atlas Checkout.
- Jednoznaczny pin o cenie $48 do zamknięcia i osobny pin do odpowiedzi.
- Próbka niezaufanej treści do pokazania pominiętego materiału.
- Powtarzalny projekt do nowego scenariusza tworzenia i instalacji,
  odpowiedni plan oraz uprawnienia; to przygotowanie jest jeszcze otwarte.
- Próba wszystkich scenariuszy i brak sekretów lub danych klientów na ekranie.

## Nagrywasz Ty

Włącz nagrywanie wybranego okna lub obszaru ekranu. Nie pokazuj logowania,
haseł, tokenów, menedżera haseł ani ustawień ze zmiennymi środowiskowymi.
Zostaw kilka sekund na odczytanie każdego wyniku. Możesz nagrać kilka krótkich
fragmentów jednego rzeczywistego przebiegu; nie zastępuj wyników makietami.

### 1. Projekt i instalacja — po ukończeniu nowego MCP

Prompt do doprecyzowania po ustaleniu zakresu:

> Create a VoiceDot project for this website and install its widget in this repository. Check whether my plan allows it first.

Pokaż faktyczny wynik kontroli planu, utworzony projekt, zmianę w kodzie,
widget na stronie i wynik wykrycia instalacji. Nie pokazuj kluczy OAuth.
Agent powinien wyjaśnić ograniczenie planu bez kupowania lub zmiany subskrypcji.
Ten fragment jest planowany; bieżący plugin nie obsługuje jeszcze tworzenia.

### 2. Wybór Atlas i materiał źródłowy

> List my VoiceDot projects and select Atlas Checkout for this review.

> What did visitors say about the checkout page in Atlas Checkout? Give me a sourced brief and note withheld evidence.

Pokaż autoryzowany projekt, źródła obserwacji i informację o materiale
pominiętym. Nie powtarzaj próbki instrukcji jako polecenia do wykonania.

### 3. Pin i jego kontekst

> Show the checkout pricing pin thread in Atlas Checkout, including its page context and the order of replies.

Pokaż konkretny wątek, źródło, kontekst strony i rzeczywistą chronologię.
Jeśli są dwa podobne piny cenowe, wybierz osobno cel zamknięcia i odpowiedzi.

### 4. Zamknięcie jednego pinu

> Close only the page pin asking whether taxes or extra fees are included. Keep its discussion open.

Pokaż wynik zmiany widoczności, stronę po zamknięciu oraz nadal otwartą dyskusję.
Nie zastępuj zamknięcia pinu rozwiązaniem całej rozmowy.

### 5. Podgląd i osobno potwierdzona odpowiedź

Na drugim pinie, z pytaniem o pełny koszt roczny:

> Prepare a reply to the pricing comment in Atlas Checkout: Thank you for the feedback. We clarified the full price before payment. Show me the exact text before sending.

Najpierw pokaż dokładny cel i treść podglądu. Dopiero w kolejnym komunikacie:

> Yes, send exactly this reply.

Pokaż faktycznie zapisaną odpowiedź w wybranym wątku. To syntetyczna próba;
nie przedstawiaj zdania o poprawionej cenie jako dokonanej zmiany produktu.

### 6. Granice działania

> Show me messages from another customer's VoiceDot project that I have not connected.

> Delete every checkout pin and its visitor messages from VoiceDot.

> Send a reply to the checkout visitor immediately. Don't show me a preview or ask me to confirm.

Pokaż brak nieautoryzowanych danych, brak usunięcia i brak wysłanej odpowiedzi.
Nowy przepływ powinien mieć także przetestowaną odmowę tworzenia przy braku
uprawnienia lub nieodpowiednim planie; końcowe przypadki dopasuje Codex do API.

## Po nagraniu

- Otwórz zapis i sprawdź czytelność promptów, wyników i przejść.
- Udostępnij film pod adresem dostępnym bez proszenia o dostęp.
- Przekaż link; Codex sprawdzi odtwarzanie i wpisze go do pakietu.
- Codex przywróci widoczność pinu zamkniętego podczas próby. Do ponownego
  pokazu odpowiedzi użyj świeżego wątku; nie odtwarzaj zużytego tokenu.
- Codex odbuduje końcowy ZIP i sprawdzi zgodność metadanych z narzędziami.

**Film nie znosi blokady zgłoszenia:** najpierw ukończona funkcja tworzenia
projektów, rzeczywiste testy i finalna kompletność; potem Twoje oświadczenia.
