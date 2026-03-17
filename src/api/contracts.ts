export type UserRole = 'Student' | 'Parent' | 'Teacher' | 'Administrator'

export type StudentStage = 1 | 2 | 3 | 4
export type RouteType = 1 | 2
export type TripDirection = 1 | 2
export type AttendanceStatus = 1 | 2 | 3 | 4
export type BroadcastAudience = 1 | 2 | 3 | 4
export type ReportType = 1 | 2 | 3
export type ExportFormat = 1

export interface TokenResponse {
  userId: string
  email: string
  accessToken: string
  refreshToken: string
  expiresAtUtc: string
}

export interface AccessibleStudentResponse {
  studentId: string
  studentNumber: string
  studentName: string
  stage: StudentStage
  gradeLabel: string
}

export interface StaffProfileSummaryResponse {
  staffProfileId: string
  employeeNumber: string
  fullName: string
  canManageAllRoutes: boolean
}

export interface CurrentUserContextResponse {
  userId: string
  email: string
  roles: UserRole[]
  displayName: string
  students: AccessibleStudentResponse[]
  staffProfile: StaffProfileSummaryResponse | null
}

export interface RegistrationDayResponse {
  date: string
  toSchool: boolean
  homebound: boolean
  toSchoolRouteId: string | null
  homeboundRouteId: string | null
}

export interface WeeklyRegistrationResponse {
  studentId: string
  studentName: string
  weekStart: string
  days: RegistrationDayResponse[]
}

export interface StudentRegistrationSummaryResponse {
  studentId: string
  studentName: string
  registeredTrips: number
  presentTrips: number
  stage: StudentStage
}

export interface RouteStopResponse {
  routeStopId: string
  sequence: number
  stopName: string
  address: string
  handoffContactName: string | null
  handoffContactPhone: string | null
}

export interface RouteAssignmentResponse {
  routeAssignmentId: string
  staffProfileId: string
  staffName: string
}

export interface RouteResponse {
  routeId: string
  routeName: string
  routeType: RouteType
  direction: TripDirection
  campusName: string
  isActive: boolean
  stops: RouteStopResponse[]
  assignments: RouteAssignmentResponse[]
}

export interface AttendanceRecordResponse {
  attendanceRecordId: string
  studentId: string
  studentName: string
  status: AttendanceStatus
  emergencyPhoneSnapshot: string | null
}

export interface AttendanceSessionResponse {
  attendanceSessionId: string
  routeId: string
  routeName: string
  date: string
  direction: TripDirection
  isCompleted: boolean
  records: AttendanceRecordResponse[]
}

export interface NotificationDeliveryResponse {
  notificationDeliveryId: string
  recipientEmail: string
  status: string
  sentAtUtc: string | null
  errorMessage: string | null
}

export interface ReminderRunResponse {
  notificationJobId: string
  deliveryCount: number
}

export interface AdminStudentLookupResponse {
  studentId: string
  studentNumber: string
  studentName: string
  stage: StudentStage
  gradeLabel: string
}

export interface AdminLookupsResponse {
  students: AdminStudentLookupResponse[]
  staffProfiles: StaffProfileSummaryResponse[]
}

export interface ReportExportResponse {
  reportExportId: string
  fileName: string
  contentType: string
  reportType: ReportType
  exportFormat: ExportFormat
  createdAtUtc: string
}

export const tripDirectionOptions = [
  { value: 1 as TripDirection, labelKey: 'common.tripDirection.toSchool' },
  { value: 2 as TripDirection, labelKey: 'common.tripDirection.homebound' },
]

export const routeTypeOptions = [
  { value: 1 as RouteType, labelKey: 'common.routeType.fixed' },
  { value: 2 as RouteType, labelKey: 'common.routeType.backup' },
]

export const attendanceStatusOptions = [
  { value: 1 as AttendanceStatus, labelKey: 'common.attendanceStatus.pending' },
  { value: 2 as AttendanceStatus, labelKey: 'common.attendanceStatus.boarded' },
  { value: 3 as AttendanceStatus, labelKey: 'common.attendanceStatus.leave' },
  { value: 4 as AttendanceStatus, labelKey: 'common.attendanceStatus.absent' },
]

export const broadcastAudienceOptions = [
  { value: 1 as BroadcastAudience, labelKey: 'common.audience.all' },
  { value: 2 as BroadcastAudience, labelKey: 'common.audience.parent' },
  { value: 3 as BroadcastAudience, labelKey: 'common.audience.student' },
  { value: 4 as BroadcastAudience, labelKey: 'common.audience.teacher' },
]

export const reportTypeOptions = [
  { value: 1 as ReportType, labelKey: 'common.reportType.weeklyRegistration' },
  { value: 2 as ReportType, labelKey: 'common.reportType.attendanceResult' },
  { value: 3 as ReportType, labelKey: 'common.reportType.notificationHistory' },
]

export const exportFormatOptions = [{ value: 1 as ExportFormat, labelKey: 'common.exportFormat.csv' }]

export const userRoleMessageKeys: Record<UserRole, string> = {
  Student: 'common.roles.Student',
  Parent: 'common.roles.Parent',
  Teacher: 'common.roles.Teacher',
  Administrator: 'common.roles.Administrator',
}

export function formatUserRole(role: UserRole, translate: (key: string) => string) {
  return translate(userRoleMessageKeys[role]) || role
}

const notificationStatusMessageKeys: Record<string, string> = {
  Pending: 'common.notificationStatus.Pending',
  Queued: 'common.notificationStatus.Queued',
  Processing: 'common.notificationStatus.Processing',
  Sent: 'common.notificationStatus.Sent',
  Delivered: 'common.notificationStatus.Delivered',
  Success: 'common.notificationStatus.Success',
  Succeeded: 'common.notificationStatus.Succeeded',
  Failed: 'common.notificationStatus.Failed',
  Error: 'common.notificationStatus.Error',
}

export function formatNotificationStatus(status: string, translate: (key: string) => string) {
  const key = notificationStatusMessageKeys[status]
  return key ? translate(key) : status
}
