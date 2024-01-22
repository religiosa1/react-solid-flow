/* eslint-disable @typescript-eslint/ban-types */

/** State initializer.
 *
 * Either a value, or a function returning a value, for lazy computing.
 * If state type is a function, then initializer is always lazy.
 */
export type Initializer<T> = T extends Function
	? () => T
	: T | (() => T);