# Contributing to FraudShield

This guide covers the team workflow for the FraudShield sprint-based development process.

---

## Branch Protection Rules

The `main` branch is protected. No one — including the repo owner — can push directly to it.
Every change must go through a pull request that:
- Has **at least 1 approval** from a teammate
- Passes all **CI checks** (Lint, Test, Build)

---

## Branching Strategy: GitHub Flow

We use **GitHub Flow** — simple and right-sized for a team of 3–6 people.

```
main  ←──── always deployable, always green
  ↑
  │   feature/akua-add-signin-validation
  │   fix/kojo-otp-typo
  │   docs/mina-update-readme
  └── chore/akosua-bump-deps
```

### Branch naming

| Type | Pattern | Example |
|---|---|---|
| New feature | `feature/yourname-description` | `feature/akua-add-signin-api` |
| Bug fix | `fix/yourname-description` | `fix/kojo-otp-redirect` |
| Documentation | `docs/yourname-description` | `docs/evans-update-readme` |
| Maintenance | `chore/yourname-description` | `chore/mina-bump-deps` |

**Always include your name** in the branch. When two people push on the same day, this prevents collisions.

---

## Workflow for Every Change

```bash
# 1. Make sure you are on a fresh main
git checkout main
git pull

# 2. Create your branch
git checkout -b feature/yourname-short-description

# 3. Make your changes and commit often
git add <specific-files>
git commit -m "feat: short description of what changed"

# 4. Push to GitHub
git push -u origin feature/yourname-short-description

# 5. Open a pull request on GitHub — the yellow banner will appear
# 6. Wait for CI to go green (1–3 minutes)
# 7. Ask a teammate to review
# 8. Once approved + CI green, YOU click "Squash and merge"
```

---

## Commit Message Format

Keep commit messages short and use the type prefix:

| Prefix | When to use |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `test:` | Adding or fixing tests |
| `chore:` | Build scripts, dependencies, config |
| `refactor:` | Code change that neither fixes a bug nor adds a feature |

Examples:
```
feat: add OTP verification endpoint
fix: correct risk scorer late-night hour check
docs: add team member to README
test: add auth rate limit integration test
```

---

## Pull Request Rules

### If you are opening the PR

- **Keep it small.** One focused change per PR. A PR with 30 files gets ignored.
- Use the PR template that auto-fills when you open the PR.
- Answer all three questions in the description: *What changed? Why? How did you test it?*
- If the work is not finished, mark the PR as **Draft**.
- Do **not** approve your own PR.

### If you are reviewing a PR

- Pull the branch locally and run it — don't just read the diff.
- Be constructive: ask "could we try X?" rather than "this is wrong".
- Check for: typos, leftover `console.log`, accidentally committed `.env` files.
- Do **not** approve if the test suite is failing.
- Click **Approve** when happy. Click **Request changes** for anything serious.

### After a PR is merged

The person who opened the PR clicks Merge. Delete the branch afterwards (GitHub offers this automatically).

---

## Sprint 0 First PR (Every Team Member)

This is your first PR. The work is tiny — the muscle memory is the point.

```bash
git checkout main && git pull
git checkout -b docs/yourname-add-name-to-readme
# Open README.md, find the Team table, add your row
git add README.md
git commit -m "docs: add <your name> to team table"
git push -u origin docs/yourname-add-name-to-readme
```

Open the PR on GitHub, ask a teammate to review, wait for CI, then merge it.

---

## Communication Rhythm

| Ritual | Format | When |
|---|---|---|
| Daily standup | Group chat (3 lines: did / will do / blocked) | Every working day |
| Sprint kickoff | 30-min call | Start of each sprint |
| Sprint demo | 30-min call | End of each sprint |
| PR review | GitHub comment or DM | Within 24 hours of request |

---

## Sprint Issue Naming

When you create a GitHub issue for a sprint task, name it:

```
S0-T1: Set up branch protection on main
S1-T3: Configure environment variables
S2-T5: Write signin and MFA routes
```

Format: `S<sprint number>-T<task number>: Short description`
