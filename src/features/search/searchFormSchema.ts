import {z} from "zod"

export const searchFormSchema = z.object({
  query: z.string(),
})

export type SearchFormValues = z.infer<typeof searchFormSchema>

export const DEFAULT_SEARCH_FORM_STATE: SearchFormValues = {
  query: "",
}
