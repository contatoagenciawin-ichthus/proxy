import { NextResponse } from "next/server"

import {
  MetaReviewError,
  assertReviewAccess,
  getMetaReviewConfig,
  maskPhone,
  metaGraphRequest,
  normalizeWhatsAppRecipient,
} from "@/lib/meta-review"

type Business = { id: string; name?: string }
type BusinessList = { data?: Business[] }
type PhoneNumber = {
  id: string
  display_phone_number?: string
  verified_name?: string
  quality_rating?: string
  platform_type?: string
}
type PhoneNumberList = { data?: PhoneNumber[] }
type Template = {
  id?: string
  name?: string
  status?: string
  category?: string
  language?: string
}
type TemplateList = { data?: Template[] }
type MessageResponse = {
  messaging_product?: string
  contacts?: Array<{ input?: string; wa_id?: string }>
  messages?: Array<{ id?: string; message_status?: string }>
}

type CreateTemplateResponse = {
  id?: string
  status?: string
  category?: string
}

const REVIEW_TEMPLATE_NAME = "proxy_app_review_demo"

function errorResponse(error: unknown) {
  if (error instanceof MetaReviewError) {
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        graph: error.details?.error
          ? {
              type: error.details.error.type,
              code: error.details.error.code,
              error_subcode: error.details.error.error_subcode,
              fbtrace_id: error.details.error.fbtrace_id,
            }
          : undefined,
      },
      { status: error.status },
    )
  }

  console.error("Meta review console error", error)
  return NextResponse.json(
    { ok: false, error: "Falha inesperada na console de revisão." },
    { status: 500 },
  )
}

async function loadBusinessContext(businessId: string) {
  try {
    const businesses = await metaGraphRequest<BusinessList>(
      "/me/businesses?fields=id,name&limit=100",
    )
    const selected = businesses.data?.find((business) => business.id === businessId)

    return {
      source: "/me/businesses",
      selected: selected || null,
      businesses: businesses.data || [],
    }
  } catch {
    const selected = await metaGraphRequest<Business>(
      `/${businessId}?fields=id,name`,
    )

    return {
      source: `/${businessId}`,
      selected,
      businesses: [selected],
    }
  }
}

export async function GET(request: Request) {
  try {
    assertReviewAccess(request)
    const config = getMetaReviewConfig()

    const [business, phoneNumbers, templates] = await Promise.all([
      loadBusinessContext(config.businessId),
      metaGraphRequest<PhoneNumberList>(
        `/${config.wabaId}/phone_numbers?fields=id,display_phone_number,verified_name,quality_rating,platform_type`,
      ),
      metaGraphRequest<TemplateList>(
        `/${config.wabaId}/message_templates?fields=id,name,status,category,language&limit=25`,
      ),
    ])

    return NextResponse.json({
      ok: true,
      graphVersion: config.graphVersion,
      identifiers: {
        businessId: config.businessId,
        wabaId: config.wabaId,
        phoneNumberId: config.phoneNumberId,
        recipient: maskPhone(config.recipientPhone),
      },
      evidence: {
        businessManagement: {
          endpoint: business.source,
          selectedBusiness: business.selected,
          businesses: business.businesses,
        },
        whatsappBusinessManagement: {
          phoneNumbersEndpoint: `/${config.wabaId}/phone_numbers`,
          templatesEndpoint: `/${config.wabaId}/message_templates`,
          phoneNumbers: phoneNumbers.data || [],
          templates: templates.data || [],
        },
        whatsappBusinessMessaging: {
          endpoint: `/${config.phoneNumberId}/messages`,
          template: "hello_world",
          recipient: maskPhone(config.recipientPhone),
        },
      },
    })
  } catch (error) {
    return errorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    assertReviewAccess(request)
    const config = getMetaReviewConfig()
    const body = (await request.json()) as {
      action?: string
      recipient?: string
    }

    if (body.action === "create_template") {
      const existing = await metaGraphRequest<TemplateList>(
        `/${config.wabaId}/message_templates?name=${encodeURIComponent(REVIEW_TEMPLATE_NAME)}&fields=id,name,status,category,language`,
      )

      if (existing.data?.length) {
        return NextResponse.json({
          ok: true,
          action: "create_template",
          reused: true,
          template: existing.data[0],
        })
      }

      const created = await metaGraphRequest<CreateTemplateResponse>(
        `/${config.wabaId}/message_templates`,
        {
          method: "POST",
          body: JSON.stringify({
            name: REVIEW_TEMPLATE_NAME,
            language: "en_US",
            category: "MARKETING",
            components: [
              {
                type: "BODY",
                text: "Proxy Technology App Review demonstration message for WhatsApp Business Management.",
              },
            ],
          }),
        },
      )

      return NextResponse.json({
        ok: true,
        action: "create_template",
        reused: false,
        template: {
          id: created.id,
          name: REVIEW_TEMPLATE_NAME,
          status: created.status,
          category: created.category,
          language: "en_US",
        },
      })
    }

    if (body.action === "send_message") {
      const recipient = normalizeWhatsAppRecipient(
        body.recipient || config.recipientPhone,
      )

      if (recipient.length < 10) {
        throw new MetaReviewError(
          "Informe META_REVIEW_RECIPIENT_PHONE na Vercel ou digite um destinatário de teste válido.",
          400,
        )
      }

      const sent = await metaGraphRequest<MessageResponse>(
        `/${config.phoneNumberId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: recipient,
            type: "template",
            template: {
              name: "hello_world",
              language: { code: "en_US" },
            },
          }),
        },
      )

      return NextResponse.json({
        ok: true,
        action: "send_message",
        recipient: maskPhone(recipient),
        waId: sent.contacts?.[0]?.wa_id,
        messageId: sent.messages?.[0]?.id,
        messageStatus: sent.messages?.[0]?.message_status,
      })
    }

    throw new MetaReviewError("Ação de revisão desconhecida.", 400)
  } catch (error) {
    return errorResponse(error)
  }
}

export const dynamic = "force-dynamic"
