# Meta App Review test sequence

1. Open `/meta/review/business-management`.
2. Enter the review access key.
3. Start Meta Login and WhatsApp Embedded Signup.
4. Verify that no unsupported-permission warning appears.
5. Complete customer authorization.
6. Confirm that the authorized WABA is returned to the review session.
7. Run server-side verification.
8. Confirm that the same WABA appears in `client_whatsapp_business_accounts` and the end-to-end checklist completes.
