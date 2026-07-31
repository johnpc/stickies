Feature: Home — understand Stickies and jump into a room
  As a first-time visitor
  I want the home page to explain how Stickies works and let me open a room
  So that I can start sharing notes without any setup

  Scenario: The home page explains how it works and offers a room entry
    Given a visitor opens the Stickies home page
    Then they see how Stickies works
    And they can open a room by name

  Scenario: Opening a room by name navigates to that room's pad
    Given a visitor opens the Stickies home page
    When they open the room "Trip Ideas" by name
    Then they land on the "trip-ideas" room pad

  Scenario: A room edited in-session shows up in recents on returning home
    Given a visitor opens the Stickies home page
    When they open a fresh room by name and add a sticky "back to recents"
    And they navigate back to the home page
    Then that fresh room is listed in the recent rooms

  Scenario: A failed recents read shows a retry, not a false empty
    Given a visitor opens the home page with the recents read failing
    Then the home page shows a retry, not a "no rooms" message
