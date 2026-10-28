import "../../admin/admin.css"
import { AdsReadOperationsShell } from "./operations-shell"

export default function AdsReadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdsReadOperationsShell>{children}</AdsReadOperationsShell>
}
