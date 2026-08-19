import type { CSSProperties } from "react"
import {
  SUPPORT_CONTACTS,
  getSupportMailto,
} from "@/config/support-contacts"
import { cn } from "@/lib/utils"

type SupportNeedHelpProps = {
  className?: string
  linkClassName?: string
  linkStyle?: CSSProperties
  prefix?: string
}

/** Compact “Need help?” line with mailto links for Mrs. Morris and Mrs. Dalfol. */
export function SupportNeedHelp({
  className,
  linkClassName,
  linkStyle,
  prefix = "Need help?",
}: SupportNeedHelpProps) {
  return (
    <p className={className}>
      {prefix}{" "}
      {SUPPORT_CONTACTS.map((contact, index) => (
        <span key={contact.email}>
          {index > 0 ? <span aria-hidden> · </span> : null}
          <a
            href={getSupportMailto(contact.email)}
            className={cn("font-semibold underline-offset-2 hover:underline", linkClassName)}
            style={linkStyle}
          >
            {contact.name}
          </a>
        </span>
      ))}
    </p>
  )
}

type SupportContactListProps = {
  className?: string
  linkStyle?: CSSProperties
}

/** Named mailto list used on help / Support Center pages. */
export function SupportContactList({ className, linkStyle }: SupportContactListProps) {
  return (
    <ul className={cn("space-y-3 text-sm", className)}>
      {SUPPORT_CONTACTS.map((contact) => (
        <li key={contact.email}>
          <a
            href={getSupportMailto(contact.email)}
            className="font-semibold underline-offset-2 hover:underline"
            style={linkStyle}
          >
            {contact.name}
          </a>
          <span className="mx-2 text-[#64748B]" aria-hidden>
            ·
          </span>
          <a
            href={getSupportMailto(contact.email)}
            className="underline-offset-2 hover:underline"
            style={linkStyle}
          >
            {contact.email}
          </a>
        </li>
      ))}
    </ul>
  )
}
