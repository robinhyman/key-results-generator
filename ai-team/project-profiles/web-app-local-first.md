# Web App Local-First Project Profile

This profile applies to web applications that must be built, tested, and demonstrated locally before later hosted deployment.

## Target Environment

Initial target demonstration environment: local web app served from the developer machine.

Future target environment: hosted deployment, once hosting is selected and configured.

## Local Demo Requirements

For any user-facing increment:

- Start the local app or preview server.
- Provide the local URL.
- Open the URL and check the affected flow.
- Confirm there are no obvious page-load, console, or network failures.
- Include the checked link in the increment report.
- If the checked link is a local URL, leave the local server running when handing the link to the user unless the user explicitly says they do not need it. Do not stop the server before final response.
- If the server cannot be left running, do not present the local URL as currently available. Say exactly how to start it again, record the limitation, and keep the increment out of `Done` if the user needs a live demo.

## Default Verification

Run when applicable:

- Install or dependency sanity check.
- Unit/component tests.
- Integration or end-to-end smoke test.
- Build.
- Lint.
- Typecheck.
- Browser check of affected user flow.
- Screenshot or visual evidence for UI changes.
- Basic accessibility sanity check for interactive UI.

## Done Rule

No web increment is `Done` without a checked working app/demo link.

During the local-first phase, the link may be a local URL if the user can open it on the same machine.

After hosted deployment is configured, production or preview URLs may be required by the issue spec.

## Deployment Notes

Do not introduce hosting or production deployment changes without explicit issue scope or user approval.

When hosting is selected, update this profile with:

- Hosting provider.
- Build command.
- Deployment command or workflow.
- Environment variable handling.
- Preview URL rules.
- Production approval rules.
