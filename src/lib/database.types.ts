
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "bible_books": {
                  Row: {
                    "chapters": number,"code": string,"ordinal": number,"testament": string
                  }
                  ComputedFields: never
                  Insert: {
                    "chapters": number,"code": string,"ordinal": number,"testament": string
                  }
                  Update: {
                    "chapters"?: number,"code"?: string,"ordinal"?: number,"testament"?: string
                  }
                  Relationships: [
                    
                  ]
                },"chapter_reads": {
                  Row: {
                    "book_code": string,"chapter": number,"read_at": string,"read_by": string | null,"record_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "book_code": string,"chapter": number,"read_at"?: string,"read_by"?: string | null,"record_id": string
                  }
                  Update: {
                    "book_code"?: string,"chapter"?: number,"read_at"?: string,"read_by"?: string | null,"record_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "chapter_reads_book_code_fkey"
      columns: ["book_code"]
isOneToOne: false
      referencedRelation: "bible_books"
      referencedColumns: ["code"]
    },{
      foreignKeyName: "chapter_reads_read_by_fkey"
      columns: ["read_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "chapter_reads_record_id_fkey"
      columns: ["record_id"]
isOneToOne: false
      referencedRelation: "reading_records"
      referencedColumns: ["id"]
    }
                  ]
                },"group_members": {
                  Row: {
                    "group_id": string,"joined_at": string,"role": Database["public"]['Enums']["group_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "group_id": string,"joined_at"?: string,"role"?: Database["public"]['Enums']["group_role"],"user_id": string
                  }
                  Update: {
                    "group_id"?: string,"joined_at"?: string,"role"?: Database["public"]['Enums']["group_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "group_members_group_id_fkey"
      columns: ["group_id"]
isOneToOne: false
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "group_members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"groups": {
                  Row: {
                    "created_at": string,"id": string,"invite_code": string,"mode": Database["public"]['Enums']["group_mode"],"name": string,"owner_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"invite_code"?: string,"mode": Database["public"]['Enums']["group_mode"],"name": string,"owner_id": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"invite_code"?: string,"mode"?: Database["public"]['Enums']["group_mode"],"name"?: string,"owner_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "groups_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"plan_enrollments": {
                  Row: {
                    "books": (string)[],"created_at": string,"created_by": string | null,"days": number,"id": string,"name": string,"record_id": string,"start_date": string,"template_key": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "books": (string)[],"created_at"?: string,"created_by"?: string | null,"days": number,"id"?: string,"name": string,"record_id": string,"start_date": string,"template_key"?: string | null
                  }
                  Update: {
                    "books"?: (string)[],"created_at"?: string,"created_by"?: string | null,"days"?: number,"id"?: string,"name"?: string,"record_id"?: string,"start_date"?: string,"template_key"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "plan_enrollments_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "plan_enrollments_record_id_fkey"
      columns: ["record_id"]
isOneToOne: false
      referencedRelation: "reading_records"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "bible_version_id": number,"created_at": string,"display_name": string,"id": string,"locale": string,"theme": string
                  }
                  ComputedFields: never
                  Insert: {
                    "bible_version_id"?: number,"created_at"?: string,"display_name"?: string,"id": string,"locale"?: string,"theme"?: string
                  }
                  Update: {
                    "bible_version_id"?: number,"created_at"?: string,"display_name"?: string,"id"?: string,"locale"?: string,"theme"?: string
                  }
                  Relationships: [
                    
                  ]
                },"reading_events": {
                  Row: {
                    "action": string,"at": string,"book_code": string,"chapter": number,"id": number,"record_id": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action": string,"at"?: string,"book_code": string,"chapter": number,"id"?: never,"record_id": string,"user_id"?: string | null
                  }
                  Update: {
                    "action"?: string,"at"?: string,"book_code"?: string,"chapter"?: number,"id"?: never,"record_id"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "reading_events_record_id_fkey"
      columns: ["record_id"]
isOneToOne: false
      referencedRelation: "reading_records"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reading_events_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"reading_records": {
                  Row: {
                    "created_at": string,"group_id": string | null,"id": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"group_id"?: string | null,"id"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"group_id"?: string | null,"id"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "reading_records_group_id_fkey"
      columns: ["group_id"]
isOneToOne: true
      referencedRelation: "groups"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "reading_records_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"record_shares": {
                  Row: {
                    "created_at": string,"id": string,"public_token": string | null,"record_id": string,"shared_with_email": string | null,"shared_with_user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"public_token"?: string | null,"record_id": string,"shared_with_email"?: string | null,"shared_with_user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"public_token"?: string | null,"record_id"?: string,"shared_with_email"?: string | null,"shared_with_user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "record_shares_record_id_fkey"
      columns: ["record_id"]
isOneToOne: false
      referencedRelation: "reading_records"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "record_shares_shared_with_user_id_fkey"
      columns: ["shared_with_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "can_read_record":
{ Args: { "p_record": string }; Returns: boolean
                           },
"can_see_profile":
{ Args: { "p_user": string }; Returns: boolean
                           },
"can_write_record":
{ Args: { "p_record": string }; Returns: boolean
                           },
"create_group":
{ Args: { "p_mode": Database["public"]['Enums']["group_mode"],"p_name": string }; Returns: string
                           },
"create_public_link":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"delete_account":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"get_public_record":
{ Args: { "p_token": string }; Returns: Json
                           },
"group_preview":
{ Args: { "p_code": string }; Returns: {
              "id": string,"is_member": boolean,"member_count": number,"mode": Database["public"]['Enums']["group_mode"],"name": string,"owner_name": string
            }[]
                           },
"group_progress":
{ Args: { "p_group": string }; Returns: {
              "chapters_read": number,"display_name": string,"joined_at": string,"record_id": string,"role": Database["public"]['Enums']["group_role"],"user_id": string
            }[]
                           },
"import_chapters":
{ Args: { "p_chapters": Json,"p_record": string }; Returns: number
                           },
"is_group_member":
{ Args: { "p_group": string }; Returns: boolean
                           },
"is_group_owner":
{ Args: { "p_group": string }; Returns: boolean
                           },
"join_group":
{ Args: { "p_code": string }; Returns: string
                           },
"new_invite_code":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"record_activity":
{ Args: { "p_record": string,"p_since"?: string,"p_tz"?: string }; Returns: {
              "chapters": number,"day": string
            }[]
                           },
"record_feed":
{ Args: { "p_limit"?: number,"p_record": string }; Returns: {
              "action": string,"at": string,"book_code": string,"chapter": number,"display_name": string,"user_id": string
            }[]
                           },
"record_reads":
{ Args: { "p_record": string }; Returns: Json
                           },
"regenerate_invite":
{ Args: { "p_group": string }; Returns: string
                           },
"remove_member":
{ Args: { "p_group": string,"p_user": string }; Returns: undefined
                           },
"reset_record":
{ Args: { "p_record": string }; Returns: undefined
                           },
"share_with_email":
{ Args: { "p_email": string }; Returns: string
                           }
          }
          Enums: {
            "group_mode": "shared"|"individual","group_role": "owner"|"member"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            "group_mode": ["shared", "individual"],"group_role": ["owner", "member"]
          }
        }
} as const
