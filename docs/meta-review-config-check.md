# Meta Login for Business configuration check

If the current v4 launcher still produces Meta's unsupported-permission warning, inspect the Login for Business configuration referenced by the app. The configuration should use the WhatsApp Embedded Signup variation and include supported WhatsApp permissions for that variation. After creating a replacement configuration, update the `configId` used by the onboarding page.
