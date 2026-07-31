Feature: Room pad — share stickies at a URL
  As anyone with a room link
  I want to add and edit stickies on a shared pad
  So that I can quickly share text and links with others at the same URL

  # Honest e2e: these assert on the REAL rendered sticky (seeded/created against
  # the live backend), not just navigation — a created note must actually appear,
  # persist across a reload, and surface the room on the home recents feed.

  Scenario: A visitor adds a sticky and sees it persist on the shared pad
    Given a visitor opens a fresh room
    When they add a sticky that says "buy oat milk"
    Then the sticky "buy oat milk" appears on the pad
    When they reload the room
    Then the sticky "buy oat milk" is still on the pad

  Scenario: Editing a text sticky into a URL turns it into a link
    Given a visitor opens a fresh room
    When they add a sticky that says "just a note"
    And they edit the first sticky to "example.com"
    Then the first sticky is a clickable link

  Scenario: The share button opens a QR + link panel and copies the room link
    Given a visitor opens a fresh room
    When they tap the share button
    Then a QR code for the room is shown
    And the room URL is copied to their clipboard

  Scenario: The room shows a live presence count for the current viewer
    Given a visitor opens a fresh room
    Then the room shows at least one person present

  Scenario: Deleting a sticky can be undone
    Given a visitor opens a fresh room
    When they add a sticky that says "oops delete"
    And they delete the first sticky
    Then the sticky "oops delete" is gone
    When they undo the delete
    Then the sticky "oops delete" appears on the pad

  Scenario: A text sticky can be copied to the clipboard
    Given a visitor opens a fresh room
    When they add a sticky that says "copy this note"
    And they copy the sticky
    Then "copy this note" is on the clipboard

  Scenario: A pasted link becomes a safe, clickable sticky
    Given a visitor opens a fresh room
    When they add a sticky that says "example.com"
    Then the sticky links to "https://example.com/"

  Scenario: A fenced snippet becomes a syntax-highlighted code sticky
    Given a visitor opens a fresh room
    When they add a fenced code snippet
    Then a code sticky is shown with line numbers

  Scenario: Uploading an image posts an inline image sticky
    Given a visitor opens a fresh room
    When they upload an image file
    Then an inline image sticky is shown

  Scenario: Uploading a text/code file shows an expandable preview
    Given a visitor opens a fresh room
    When they upload a text file with many lines
    Then a document sticky shows a preview with an expand control

  Scenario: A pasted URL with OpenGraph tags shows a rich preview card
    Given a visitor opens a fresh room
    When they add a sticky that says "https://github.com"
    Then a link preview card is shown

  Scenario: A sticky can be recolored and the color persists
    Given a visitor opens a fresh room
    When they add a sticky that says "recolor me"
    And they recolor the first sticky blue
    And they reload the room
    Then the first sticky is blue

  Scenario: A sticky can be made larger and the size persists
    Given a visitor opens a fresh room
    When they add a sticky that says "make me big"
    And they enlarge the first sticky to large
    And they reload the room
    Then the first sticky is large

  Scenario: Stickies can be reordered by dragging and the order persists
    Given a visitor opens a fresh room
    When they add three stickies "one" "two" "three"
    And they drag the last sticky onto the first
    And they reload the room
    Then the stickies read "three" "one" "two"

  Scenario: Stickies can be reordered with the keyboard (no mouse) and it persists
    Given a visitor opens a fresh room
    When they add three stickies "one" "two" "three"
    And they move the first sticky right with the keyboard
    And they reload the room
    Then the stickies read "two" "one" "three"

  Scenario: A dangerous javascript: URL is never rendered as a link
    Given a visitor opens a fresh room
    When they add a sticky that says "javascript:alert(1)"
    Then no sticky is a clickable link

  Scenario: An edited room shows up in the home recents feed
    Given a visitor opens a fresh room
    When they add a sticky that says "hello recents"
    And they go back to the home page
    Then their room is listed in the recent rooms

  # Deep-linking: the SAME shared https URL opens the app if installed, else the
  # browser. In a browser the room URL just loads normally (the graceful
  # fallback), and the app-association file is served for the OS to verify.
  Scenario: A shared room link opens the pad directly in the browser
    Given a visitor opens the room "shared-link-demo" directly by URL
    Then they land on the "shared-link-demo" room pad
    And the app-association file is served at ".well-known/apple-app-site-association"

  # A URL with more than one path segment (a hierarchical name, or a mangled
  # link) used to render a blank screen — no route matched. It now resolves to a
  # pad, with the slashes collapsed into a single room slug.
  Scenario: A multi-segment room URL still opens a pad (no blank screen)
    Given a visitor opens the path "team/standup" directly
    Then they land on a pad titled "teamstandup"
