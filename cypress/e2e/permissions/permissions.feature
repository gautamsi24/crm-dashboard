Feature: Role-based permissions

  The toolbar always shows every action — disabled buttons tell the user
  what permission they are missing. Only actions the user's role grants
  are interactive. This ensures no silent hiding of features.

  # ── Alice Reader — user (Free) — document:view + customer:view only ──────────

  Scenario: Free user sees all toolbar actions but cannot interact with any
    Given I am logged in as "Alice Reader"
    And I open the document workspace
    Then the Edit toolbar button should be disabled
    And the Edit toolbar button should show a permission tooltip
    And the Split toolbar button should be disabled
    And the Merge toolbar button should be disabled
    And the Delete toolbar button should be disabled
    And the Comment toolbar button should be disabled
    And the comments panel toggle should be disabled

  Scenario: Free user cannot open the comments sidebar
    Given I am logged in as "Alice Reader"
    And I open the document workspace
    When I try to click the comments panel toggle
    Then the comments sidebar should not be rendered

  # ── Bob Creator — proUser (Pro) — +edit, comment, annotate ──────────────────

  Scenario: Pro user can edit and comment but not split merge or delete
    Given I am logged in as "Bob Creator"
    And I open the document workspace
    Then the Edit toolbar button should be enabled
    And the Comment toolbar button should be enabled
    And the comments panel toggle should be enabled
    And the Split toolbar button should be disabled
    And the Merge toolbar button should be disabled
    And the Delete toolbar button should be disabled

  Scenario: Pro user can open the comments sidebar
    Given I am logged in as "Bob Creator"
    And I open the document workspace
    When I click the comments panel toggle
    Then the comments sidebar should be visible

  Scenario: Pro user can enter edit mode
    Given I am logged in as "Bob Creator"
    And the document is fully loaded in the workspace
    When I click the Edit toolbar button
    Then the edit status bar should be visible

  # ── Carol Manager — superUser (Business) — +split, merge, delete ─────────────

  Scenario: Business user can access all document actions
    Given I am logged in as "Carol Manager"
    And I open the document workspace
    Then the Edit toolbar button should be enabled
    And the Split toolbar button should be enabled
    And the Merge toolbar button should be enabled
    And the Delete toolbar button should be enabled
    And the Comment toolbar button should be enabled

  Scenario: Business user can trigger the split document dialog
    Given I am logged in as "Carol Manager"
    And the document is fully loaded in the workspace
    When I click the Split toolbar button
    Then the split document dialog should be visible

  Scenario: Business user can trigger the delete document dialog
    Given I am logged in as "Carol Manager"
    And the document is fully loaded in the workspace
    When I click the Delete toolbar button
    Then the delete document dialog should be visible

  # ── Dave Admin — admin (Enterprise) — full access ─────────────────────────────

  Scenario: Admin user has all permissions enabled
    Given I am logged in as "Dave Admin"
    And I open the document workspace
    Then the Edit toolbar button should be enabled
    And the Split toolbar button should be enabled
    And the Merge toolbar button should be enabled
    And the Delete toolbar button should be enabled
    And the Comment toolbar button should be enabled

  # ── Unauthenticated access ────────────────────────────────────────────────────

  Scenario: Unauthenticated user is redirected to login
    Given I am not logged in
    When I navigate directly to "/customers"
    Then I should be redirected to the login page
