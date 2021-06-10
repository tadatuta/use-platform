export function isValidKeyboardEvent(event: KeyboardEvent): boolean {
  const { key, target } = event
  const element = target as HTMLElement

  const role = element.getAttribute('role')
  const isHTMLAnchorLink = element.tagName === 'A' && element.hasAttribute('href')

  // Accessibility for keyboards. Space and Enter only.
  // "Spacebar" is for IE 11
  return (
    (key === 'Enter' || key === ' ' || key === 'Spacebar') &&
    // A link with a valid href should be handled natively,
    // unless it also has role='button' and was triggered using Space.
    (!isHTMLAnchorLink || (role === 'button' && key !== 'Enter')) &&
    // An element with role='link' should only trigger with Enter key
    !(role === 'link' && key !== 'Enter')
  )
}