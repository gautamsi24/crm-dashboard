Feature: Document Workspace

  As a logged-in CRM user
  I want to open, read, edit, and comment on customer documents
  So that I can manage document records effectively

  Background:
    Given I am logged in as "Bob Creator"
    And I navigate to the customers page

  # ── Opening & closing ──────────────────────────────────────────────────────

  Scenario: Clicking a customer row opens the document workspace
    When I click on the first customer row
    Then the document workspace should be visible
    And the workspace should display a filename

  Scenario: Closing the workspace returns to the table
    Given the document workspace is open
    When I click the workspace close button
    Then the document workspace should not be visible
    And the customers table should still be visible

  # ── Document loading ───────────────────────────────────────────────────────

  Scenario: Document content loads and becomes readable
    Given the document workspace is open
    Then the document content should eventually be visible
    And the page indicator should show "1 /"

  Scenario: Page sidebar shows page thumbnails once loaded
    Given the document workspace is open
    Then the page navigator sidebar should list at least 1 page

  # ── Page navigation ────────────────────────────────────────────────────────

  Scenario: Navigating to the next page via footer button
    Given the document is fully loaded
    When I click the next page button in the workspace footer
    Then the page indicator should show "2 /"
    And the document content should update

  Scenario: Navigating back to the previous page
    Given the document is fully loaded
    And I have navigated to page 2
    When I click the previous page button in the workspace footer
    Then the page indicator should show "1 /"

  Scenario: Navigating to a specific page via the sidebar
    Given the document is fully loaded
    When I click page 3 in the page navigator sidebar
    Then the page indicator should show "3 /"

  # ── Edit mode ──────────────────────────────────────────────────────────────

  Scenario: Entering edit mode shows the status bar
    Given the document is fully loaded
    When I click the Edit button in the document toolbar
    Then the edit status bar should be visible
    And the editable content area should be active

  Scenario: Typing in edit mode triggers the auto-save indicator
    Given the document is in edit mode
    When I type "E2E test annotation" in the editable content
    Then the edit status bar should eventually show "Saved"

  Scenario: Exiting edit mode hides the status bar
    Given the document is in edit mode
    When I click "Done editing" in the status bar
    Then the edit status bar should not be visible
    And the read-only content area should be visible

  # ── Comments ───────────────────────────────────────────────────────────────

  Scenario: Opening the comments panel shows the sidebar
    Given the document is fully loaded
    When I click the Comment toggle in the toolbar
    Then the comments sidebar should be visible

  Scenario: Adding a comment via text selection and floating bubble
    Given the document is fully loaded
    And the comments panel is open
    When I select text in the document content area
    And the floating comment bubble appears
    And I click "Add comment" in the bubble
    And I type "This is an E2E comment" in the bubble input
    And I submit the comment
    Then the comment "This is an E2E comment" should appear in the sidebar

  Scenario: Filtering comments to show all pages
    Given the document is fully loaded
    And the comments panel is open
    When I click "All" in the comments filter
    Then the comments filter should show all document comments
