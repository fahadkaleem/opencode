# Coding Standards - Validation Checklist

Use this checklist to verify that a coding standard document is complete and effective before marking it as Active.

---

## 1. Document Structure

### 1.1 Header Block

- [ ] Standard ID follows format `STD-XXX`
- [ ] Document Version is specified
- [ ] Last Updated date is current
- [ ] Status is set (Draft, In Review, or Active)
- [ ] Scope clearly defines what the standard covers
- [ ] Enforcement level is specified (Manual, Automated, Hybrid)
- [ ] Related Documents are linked

### 1.2 Required Sections

- [ ] Overview section explains purpose and scope
- [ ] Guiding Principles are documented (3-5 principles)
- [ ] Main content sections are complete
- [ ] Anti-Patterns section exists with forbidden patterns
- [ ] Enforcement section specifies how rules are enforced
- [ ] Exceptions section documents when rules can be broken
- [ ] Quick Reference provides at-a-glance summary
- [ ] Traceability links to related standards
- [ ] Document History tracks changes

---

## 2. Content Quality

### 2.1 Clarity for AI Consumption

- [ ] Rules are unambiguous (single interpretation possible)
- [ ] All rules have explicit correct/incorrect examples
- [ ] Decision trees provided for complex choices
- [ ] Forbidden patterns are explicitly listed
- [ ] No subjective terms without quantification (avoid "appropriate", "reasonable")
- [ ] All terminology is defined or links to definitions

### 2.2 Completeness

- [ ] All rules have rationale explaining "why"
- [ ] Edge cases are addressed
- [ ] Exception scenarios are documented
- [ ] All referenced tools/configs are specified
- [ ] No placeholder text (`[TBD]`, `TODO`) remains

### 2.3 Actionability

- [ ] Rules can be verified (testable criteria)
- [ ] Automated checks are specified where possible
- [ ] Manual review checklists are provided
- [ ] Code examples are syntactically correct
- [ ] Commands are copy-paste ready

---

## 3. Template-Specific Checks

### 3.1 Rule-Based Standards (Naming, Style, Git)

- [ ] Each rule has Enforcement level (MUST/SHOULD/MAY)
- [ ] Lookup tables summarize all rules
- [ ] Vocabulary reference defines allowed terms
- [ ] ESLint/TypeScript configurations provided
- [ ] Pre-commit hook examples included

### 3.2 Pattern-Based Standards (Architecture, Errors, CLI)

- [ ] Layer diagram shows component relationships
- [ ] Dependency direction rules are explicit
- [ ] Role definitions table is complete
- [ ] Each pattern has "When to Use" criteria
- [ ] Implementation templates are provided
- [ ] Complete working examples included

### 3.3 Configuration-Based Standards (TypeScript, Deps, Build)

- [ ] Literal configuration files are provided
- [ ] Each setting has rationale documented
- [ ] Forbidden settings are explicitly listed
- [ ] Version requirements are specified
- [ ] Environment variables are documented
- [ ] Validation scripts are provided

### 3.4 Process-Based Standards (Testing, Docs, Security)

- [ ] Process flow diagram exists
- [ ] Step-by-step procedures are documented
- [ ] Quality gates have pass/fail criteria
- [ ] Checklists are actionable
- [ ] Automation scripts are provided
- [ ] Metrics and targets are defined

---

## 4. Enforcement Quality

### 4.1 Automated Enforcement

- [ ] ESLint rules are specified with exact configuration
- [ ] TypeScript compiler options are documented
- [ ] CI/CD validation steps are provided
- [ ] Pre-commit hooks are defined
- [ ] All automated checks have expected output documented

### 4.2 Manual Enforcement

- [ ] Code review checklist is provided
- [ ] Review criteria are objective (not subjective)
- [ ] Approval process is defined
- [ ] Exception approval workflow is documented

---

## 5. Exception Handling

### 5.1 Exception Documentation

- [ ] Valid exception scenarios are listed
- [ ] Justification requirements are specified
- [ ] Approval process is defined
- [ ] Exception documentation format is provided
- [ ] Exception registry template exists (if applicable)

### 5.2 Exception Quality

- [ ] Exceptions are truly exceptional (not common cases)
- [ ] Each exception has clear boundaries
- [ ] Temporary exceptions have expiry dates
- [ ] Permanent exceptions have strong justification

---

## 6. Examples Quality

### 6.1 Code Examples

- [ ] All examples compile/run without errors
- [ ] Examples use realistic scenarios
- [ ] Both correct and incorrect versions provided
- [ ] Examples show edge cases
- [ ] Examples are consistent with other standards

### 6.2 Example Coverage

- [ ] Happy path examples exist
- [ ] Error handling examples exist
- [ ] Edge case examples exist
- [ ] Anti-pattern examples exist

---

## 7. Cross-Standard Consistency

### 7.1 Terminology

- [ ] Terms are consistent with other standards
- [ ] Role names match across standards
- [ ] Pattern names match across standards
- [ ] ID formats are consistent

### 7.2 Format

- [ ] Table formats match other standards
- [ ] Code block formatting is consistent
- [ ] Header hierarchy matches other standards
- [ ] Checklist format is consistent

---

## 8. Usability

### 8.1 Navigation

- [ ] Quick Reference enables fast lookup
- [ ] Decision trees simplify complex choices
- [ ] Tables are sortable/scannable
- [ ] Cross-references use links

### 8.2 Maintainability

- [ ] Document can be updated incrementally
- [ ] Version history tracks all changes
- [ ] Related standards are linked bidirectionally
- [ ] No duplicate content (references instead)

---

## 9. AI-Specific Requirements

### 9.1 Precision

- [ ] Rules require zero interpretation
- [ ] All options are enumerated (no open-ended choices)
- [ ] Boundaries are quantified (not "several", but "3-5")
- [ ] Priority order is explicit when rules conflict

### 9.2 Templates

- [ ] Copy-paste code templates provided
- [ ] Templates cover common scenarios
- [ ] Templates are syntactically complete
- [ ] Variable sections are clearly marked

### 9.3 Forbidden Patterns

- [ ] All forbidden patterns are explicitly listed
- [ ] Detection methods are specified
- [ ] Severity levels are assigned
- [ ] Correct alternatives are provided

---

## 10. Final Verification

### 10.1 Author Review

- [ ] Author has reviewed all sections
- [ ] All examples have been tested
- [ ] All links are valid
- [ ] Formatting is correct

### 10.2 Peer Review

- [ ] At least one peer has reviewed
- [ ] Feedback has been addressed
- [ ] Ambiguities have been resolved
- [ ] Conflicts with other standards resolved

### 10.3 Approval

- [ ] Document owner has approved
- [ ] Status updated to Active
- [ ] Version number incremented
- [ ] Related standards updated (if needed)

---

## Common Issues to Watch For

| Issue               | How to Fix                               |
| ------------------- | ---------------------------------------- |
| Vague rules         | Add quantified criteria and examples     |
| Missing "why"       | Add rationale for each rule              |
| Subjective terms    | Replace with measurable criteria         |
| Incomplete examples | Add edge cases and anti-patterns         |
| No enforcement      | Specify ESLint rules or review checklist |
| Conflicting rules   | Add priority order or decision tree      |
| Missing exceptions  | Document when rules can be broken        |
| Outdated references | Update links and version numbers         |

---

## Ready for Active Status?

Answer these questions:

1. **Can an AI agent follow this standard without human clarification?**
   - [ ] Yes
   - [ ] No → Add more examples and decision trees

2. **Are all rules enforceable (automated or via review)?**
   - [ ] Yes
   - [ ] No → Add enforcement mechanisms

3. **Are exceptions clearly documented?**
   - [ ] Yes
   - [ ] No → Document valid exception scenarios

4. **Is this consistent with related standards?**
   - [ ] Yes
   - [ ] No → Resolve conflicts

5. **Has this been peer reviewed?**
   - [ ] Yes
   - [ ] No → Request review

**If all checks pass → Update Status to Active**
