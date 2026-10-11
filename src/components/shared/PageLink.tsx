import { Link, type LinkProps } from 'react-router'
import { useLinkVisible } from '../../lib/siteModules'

/** Link interno que desaparece si su página (o vista) está apagada en el panel · Sitio */
export function PageLink(props: LinkProps & { to: string }) {
  return useLinkVisible(props.to) ? <Link {...props} /> : null
}
