import {View} from "react-native"

import {Column} from "@/components/Column"
import {Row} from "@/components/Row"
import {Text, TextClassContext} from "@/components/ui/text"
import {cn} from "@/lib/utils"

function Card({
  className,
  ...props
}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return (
    <TextClassContext.Provider value="text-card-foreground">
      <Column
        className={cn(
          "bg-card border-border/80 gap-5 rounded-lg border py-5",
          className
        )}
        {...props}
      />
    </TextClassContext.Provider>
  )
}

function CardHeader({
  className,
  ...props
}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <Column className={cn("gap-1.5 px-5", className)} {...props} />
}

function CardTitle({
  className,
  ref,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return (
    <Text
      ref={ref}
      role="heading"
      aria-level={3}
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text> & React.RefAttributes<typeof Text>) {
  return (
    <Text
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardContent({
  className,
  ...props
}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <View className={cn("px-5", className)} {...props} />
}

function CardFooter({
  className,
  ...props
}: React.ComponentProps<typeof View> & React.RefAttributes<View>) {
  return <Row className={cn("items-center px-5", className)} {...props} />
}

export {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle}
