import React, { HTMLAttributes, useCallback, useState } from 'react'

import { usePress } from '../../interactions/press'
import { useFocusManager } from '../../libs/focus'
import { useLocale } from '../../libs/i18n'
import { mergeProps } from '../../libs/merge-props'
import { useSpinButton } from '../spinbutton'
import { DateTimeEditableSegment } from './types'
import { UseDateTimeFieldStateResult } from './useDateTimeFieldState'
import { getAriaValueAttributes, parseSegmentValue } from './utils'

export interface UseDateTimeFieldSegmentProps {
  segment: DateTimeEditableSegment
}

export interface UseDateTimeFieldSegmentResult {
  segmentProps: HTMLAttributes<HTMLElement>
}

export function useDateTimeFieldSegment(
  props: UseDateTimeFieldSegmentProps,
  state: UseDateTimeFieldStateResult,
): UseDateTimeFieldSegmentResult {
  const { segment } = props
  const { type, value, max, text, isValid, isDisabled } = segment
  const {
    resolvedOptions,
    increment,
    decrement,
    extraIncrement,
    extraDecrement,
    incrementToMax,
    decrementToMin,
    setSegmentValue,
  } = state
  const { isRTL } = useLocale()
  const { focusNext, focusPrevious } = useFocusManager()
  const [enteredKeys, setEnteredKeys] = useState('')

  const ariaValueAttrs = getAriaValueAttributes(segment, resolvedOptions)
  const { spinButtonProps } = useSpinButton({
    ...ariaValueAttrs,
    textValue: text,
    disabled: isDisabled,
    onIncrement: useCallback(() => increment(type), [increment, type]),
    onDecrement: useCallback(() => decrement(type), [decrement, type]),
    onExtraIncrement: useCallback(() => extraIncrement(type), [extraIncrement, type]),
    onExtraDecrement: useCallback(() => extraDecrement(type), [extraDecrement, type]),
    onIncrementToMax: useCallback(() => incrementToMax(type), [incrementToMax, type]),
    onDecrementToMin: useCallback(() => decrementToMin(type), [decrementToMin, type]),
  })

  const { pressProps } = usePress({
    onPressStart: (event) => {
      if (event.source === 'mouse') {
        event.currentTarget.focus()
      }
    },
  })

  const setValue = useCallback(
    (v: number | null) => {
      setSegmentValue(type, v)

      if (v === null || v * 10 >= max) {
        setEnteredKeys('')
      }
    },
    [max, setSegmentValue, type],
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      // TODO: check the use of special keys for entering digits in different locales (ex. ar-AE)
      if (['Tab', 'Shift', 'Alt', 'Meta'].includes(event.key) || event.ctrlKey || event.metaKey) {
        return
      }

      event.preventDefault()

      const focusOptions = { from: event.currentTarget, tabbable: true }

      switch (event.key) {
        case 'ArrowLeft': {
          const focusElement = isRTL ? focusNext : focusPrevious
          focusElement(focusOptions)
          break
        }

        case 'ArrowRight': {
          const focusElement = isRTL ? focusPrevious : focusNext
          focusElement(focusOptions)
          break
        }

        case 'Backspace': {
          if (isDisabled || value === null) {
            focusPrevious(focusOptions)
          } else {
            setValue(null)
          }

          break
        }

        default:
          const newValue = enteredKeys + event.key
          const numberValue = parseSegmentValue(type, newValue)

          // TODO: check readOnly
          if (isDisabled || numberValue === null) {
            return
          }

          event.stopPropagation()
          setValue(numberValue)

          const maxLen = max.toString().length
          // if the number with next digit capacity is greater than the maximum,
          // move the focus to the next segment
          if (newValue.length >= maxLen || numberValue * 10 >= max) {
            focusNext(focusOptions)
          } else {
            setEnteredKeys(newValue)
          }
      }
    },
    [enteredKeys, focusNext, focusPrevious, isDisabled, isRTL, max, setValue, type, value],
  )

  const segmentProps: HTMLAttributes<HTMLElement> = {
    // TODO: set aria props
    // 'aria-label': '',
    // 'aria-labelledby': '',
    // TODO: may be move to useDateTimeField?
    'aria-invalid': !isValid,
    tabIndex: 0,
    onKeyDown,
    onFocus: useCallback(() => {
      setEnteredKeys('')
    }, []),
  }

  if (!isDisabled) {
    segmentProps.inputMode = 'numeric'
    // TODO: Voice over incorrect work with contentEditable
    segmentProps.contentEditable = true
    segmentProps.suppressContentEditableWarning = true
  }

  return {
    segmentProps: mergeProps(spinButtonProps, pressProps, segmentProps),
  }
}
