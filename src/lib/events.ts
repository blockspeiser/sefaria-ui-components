/**
 * Simple event system for component-to-parent communication.
 *
 * Components emit events with a type and optional data payload.
 * Parents handle events via a single onEvent callback.
 *
 * @example
 * // In a component:
 * type MyEvents = TextBlockEvent<'click', { x: number }> | TextBlockEvent<'hover'>;
 * props.onEvent?.({ type: 'click', data: { x: 100 } });
 *
 * // In a parent:
 * <TextBlock
 *   onEvent={(event) => {
 *     if (event.type === 'click') console.log(event.data.x);
 *   }}
 * />
 */

/**
 * Base event type. All component events extend this.
 */
export interface ComponentEvent<
  TType extends string = string,
  TData = undefined,
> {
  type: TType;
  data: TData;
}

/**
 * Helper to create typed events for a component.
 * The component name prefix helps with debugging and filtering.
 *
 * @example
 * type ClickEvent = ComponentEventOf<'TextBlock', 'click', { x: number }>;
 * // Results in: { type: 'TextBlock:click', data: { x: number } }
 */
export type ComponentEventOf<
  TComponent extends string,
  TType extends string,
  TData = undefined,
> = ComponentEvent<`${TComponent}:${TType}`, TData>;

/**
 * Event handler type. Components accept this as their onEvent prop.
 */
export type EventHandler<TEvent extends ComponentEvent<string, unknown> = ComponentEvent<string, unknown>> = (
  event: TEvent
) => void;

/**
 * Helper to create an event object with proper typing.
 */
export function createEvent<TType extends string, TData = undefined>(
  type: TType,
  data?: TData
): ComponentEvent<TType, TData> {
  return { type, data: data as TData };
}

/**
 * Helper to emit an event through an optional handler.
 * Safely handles undefined handlers.
 */
export function emitEvent<TEvent extends ComponentEvent>(
  handler: EventHandler<TEvent> | undefined,
  event: TEvent
): void {
  handler?.(event);
}

/**
 * Type guard to check if an event matches a specific type.
 *
 * @example
 * if (isEventType(event, 'TextBlock:click')) {
 *   // event.data is typed correctly
 * }
 */
export function isEventType<
  TEvent extends ComponentEvent,
  TType extends TEvent["type"],
>(
  event: TEvent,
  type: TType
): event is Extract<TEvent, { type: TType }> {
  return event.type === type;
}
