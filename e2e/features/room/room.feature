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

  Scenario: A pasted link becomes a safe, clickable sticky
    Given a visitor opens a fresh room
    When they add a sticky that says "example.com"
    Then the sticky links to "https://example.com/"

  Scenario: A dangerous javascript: URL is never rendered as a link
    Given a visitor opens a fresh room
    When they add a sticky that says "javascript:alert(1)"
    Then no sticky is a clickable link

  Scenario: An edited room shows up in the home recents feed
    Given a visitor opens a fresh room
    When they add a sticky that says "hello recents"
    And they go back to the home page
    Then their room is listed in the recent rooms
