import { generateGqlResponseType } from "@src/_common/graphql/graphql-response.type"
import { DashboardEmail } from "../models/dashboard-email.entity"

export const GqlDashboardEmailsResponse = generateGqlResponseType([DashboardEmail])
export const GqlDashboardEmailResponse = generateGqlResponseType(DashboardEmail)