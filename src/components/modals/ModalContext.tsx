import React, {
  createContext,
  use,
  useRef,
  useState,
  type ComponentType,
  type PropsWithChildren,
  type ReactNode,
} from "react"
import {Keyboard} from "react-native"

import {
  BottomSheetBackdrop,
  BottomSheetModal,
  useBottomSheetTimingConfigs,
  type BottomSheetBackdropProps,
} from "@gorhom/bottom-sheet"
import {Easing} from "react-native-reanimated"

import {BottomSheetContainer} from "./BottomSheetContainer"
import {
  getBottomSheetBackgroundStyle,
  getBottomSheetHandleIndicatorStyle,
} from "./bottomSheetTheme"

type ModalContextType = {
  hideModal: () => Promise<void>
  showModal: <T extends object>(
    Component: ComponentType<T>,
    propsOrFactory?: ((dismiss: () => Promise<void>) => T) | Partial<T>
  ) => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export const useModalContext = () => {
  const context = use(ModalContext)
  if (!context) {
    throw new Error("useModalContext must be used within a ModalProvider")
  }

  return context
}

export const ModalProvider = ({children}: PropsWithChildren) => {
  const bottomSheetRef = useRef<BottomSheetModal>(null)

  const [modalContent, setModalContent] = useState<ReactNode | null>(null)
  const [dismissPromise, setDismissPromise] = useState<{
    resolve: () => void
  } | null>(null)

  const [isDismissable, setIsDismissable] = useState(true)

  const timingConfig = useBottomSheetTimingConfigs({
    duration: 250,
    easing: Easing.out(Easing.quad),
  })

  const showModal = <T extends object>(
    Component: ComponentType<T>,
    propsOrFactory?: ((dismiss: () => Promise<void>) => T) | Partial<T>,
    isDismissable?: boolean
  ) => {
    const dismiss = () => {
      bottomSheetRef.current?.dismiss()

      return new Promise<void>(resolve => {
        setDismissPromise({resolve})
      })
    }

    let props: T
    if (typeof propsOrFactory === "function") {
      props = propsOrFactory(dismiss)
    } else if (propsOrFactory) {
      props = propsOrFactory as T
    } else {
      props = {} as T
    }

    setIsDismissable(isDismissable ?? true)

    Keyboard.dismiss()
    setModalContent(<Component {...props} />)
    bottomSheetRef.current?.present()
  }

  const hideModal = () => {
    bottomSheetRef.current?.dismiss()

    return new Promise<void>(resolve => {
      setDismissPromise({resolve})
    })
  }

  const handleDismiss = () => {
    if (dismissPromise) {
      dismissPromise.resolve()
      setDismissPromise(null)
    }
  }

  const renderBackdrop = (props: BottomSheetBackdropProps) => (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      opacity={0.65}
      pressBehavior={isDismissable ? "close" : "none"}
    />
  )

  return (
    <ModalContext.Provider value={{showModal, hideModal}}>
      {children}
      <BottomSheetModal
        ref={bottomSheetRef}
        index={0}
        accessible={false}
        android_keyboardInputMode="adjustResize"
        backdropComponent={renderBackdrop}
        backgroundStyle={getBottomSheetBackgroundStyle()}
        enableBlurKeyboardOnGesture
        enableDismissOnClose={isDismissable}
        enablePanDownToClose={isDismissable}
        handleIndicatorStyle={getBottomSheetHandleIndicatorStyle()}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        onDismiss={handleDismiss}
        animationConfigs={{
          ...timingConfig,
        }}
      >
        <BottomSheetContainer>{modalContent}</BottomSheetContainer>
      </BottomSheetModal>
    </ModalContext.Provider>
  )
}
