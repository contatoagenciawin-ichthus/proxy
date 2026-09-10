# Meta Embedded Signup v4 launch note

The reviewer-facing Embedded Signup launcher uses the current Login for Business invocation shape:

- `config_id`
- `auth_type: "rerequest"`
- `response_type: "code"`
- `override_default_response_type: true`
- `extras.setup`

Legacy `sessionInfoVersion`, `version`, `featureType`, and `features` launch fields were removed from the review flow because they belong to older Embedded Signup examples and can interfere with current Login for Business behavior.

If Meta still shows a “supported permission” warning after this code update, the remaining issue is the Login for Business configuration identified by `config_id`; recreate or update that configuration in Meta using the WhatsApp Embedded Signup variation and the supported WhatsApp permissions, then update the application configuration ID.
