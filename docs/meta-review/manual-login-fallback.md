# Manual Facebook Login for Business fallback

The reviewer-facing WhatsApp Embedded Signup flow can be launched without the JavaScript SDK if the SDK path is intercepted by browser FedCM behavior.

Meta's Facebook Login for Business documentation supports manually building the login flow with a configuration ID. For the system-user access token configuration used by Proxy, the manual OAuth URL must include the app ID, the Embedded Signup configuration ID, `response_type=code`, `override_default_response_type=true`, and the allow-listed redirect URI.

This fallback is intended for App Review troubleshooting only. It uses the same Meta configuration and permissions; it only changes how the login dialog is invoked.
