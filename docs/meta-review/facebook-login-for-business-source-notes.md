# Facebook Login for Business source notes

Source supplied for Meta App Review troubleshooting on 2026-09-11.

Key implementation requirements used by the review route:

- Each installation must include at least one supported business permission beyond `email` / `public_profile`.
- Supported permissions include `business_management`, `whatsapp_business_management`, and `whatsapp_business_messaging`.
- A Business Integration System User access token configuration must invoke `FB.login` with `config_id`, `response_type: "code"`, and `override_default_response_type: true`.
- Do not add `scope` when using `config_id`.
- The selected Login for Business configuration is responsible for its token type, assets, and permissions.

The production review launcher should intentionally match the documented invocation shape and avoid additional OAuth parameters unless required by the active WhatsApp Embedded Signup guide.
