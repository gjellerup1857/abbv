- **Release:** (Include link to the milestone that is to be released)
- **Version:** (Release version string)

## QA checklist

! NOTE (delete before creating the release issue): lines with _[if applicable]_ suffix are not needed for every release- remove/keep them as needed.

### Pre-testing

- [ ] regression tests are updated ([cucumber project](https://studio.cucumber.io/projects/283030)) _[@person_responsible]_ [if applicable]
- [ ] testpages autotests are passing _[@person_responsible]_
- [ ] E2E autotests are passing _[@person_responsible]_
- [ ] test runs are created _[@person_responsible]_

### Release testing

- [ ] retest issues that need retesting [if applicable]
- [ ] **Edge: latest | Chrome, Firefox: minimum** (Link to testrun) _[@person_responsible]_
- [ ] **Chrome other** (Link to testrun) _[@person_responsible]_
- [ ] **Chrome misc** (Link to testrun) _[@person_responsible]_ [if applicable]
- [ ] **Chrome latest** (Link to testrun) _[@person_responsible]_
- [ ] **Firefox latest** (Link to testrun) _[@person_responsible]_

### Filterlist updates

- [ ]  E2E autotests are passing (filterlists tag)

/label ~"Product:: AdBlock"
