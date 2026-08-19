import {type ComponentType} from "react"

import {useModalContext} from "@/components/modals/ModalContext"

type UseModalPropsFactory<T extends object> = (
  dismiss: () => Promise<void>
) => T

export function useModal<T extends object>(
  Component: ComponentType<T>
): (overrideProps: T) => void

export function useModal<T extends object>(
  Component: ComponentType<T>,
  propsOrFactory: UseModalPropsFactory<T> | Partial<T>
): (overrideProps?: Partial<T>) => void

export function useModal<T extends object>(
  Component: ComponentType<T>,
  propsOrFactory?: UseModalPropsFactory<T> | Partial<T>
) {
  const {showModal} = useModalContext()

  return (overrideProps?: Partial<T>) => {
    showModal(Component, dismiss => {
      const baseProps =
        typeof propsOrFactory === "function"
          ? propsOrFactory(dismiss)
          : ({
              ...(propsOrFactory ?? {}),
              dismiss,
            } as T)

      return {
        ...baseProps,
        ...(overrideProps ?? {}),
      }
    })
  }
}
