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

  Scenario: The share button copies the room link to the clipboard
    Given a visitor opens a fresh room
    When they tap the share button
    Then the room URL is copied to their clipboard

  Scenario: A pasted link becomes a safe, clickable sticky
    Given a visitor opens a fresh room
    When they add a sticky that says "example.com"
    Then the sticky links to "https://example.com/"

  Scenario: A fenced snippet becomes a syntax-highlighted code sticky
    Given a visitor opens a fresh room
    When they add a fenced code snippet
    Then a code sticky is shown with line numbers

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
