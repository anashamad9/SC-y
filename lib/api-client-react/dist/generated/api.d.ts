import type { QueryKey, UseMutationOptions, UseMutationResult, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import type { AIChatRequest, AdminStats, Assessment, AssessmentDetail, AssessmentResult, AssessmentSubmission, AuditLogList, AuthResponse, CampaignResultsList, CciHistory, CompleteOnboarding200, Course, CourseDetail, CourseProgress, CourseProgressUpdate, CourseWithProgress, CreateAdminNotificationBody, Department, DepartmentInput, DepartmentUpdate, ExecutiveDashboard, ForgotPasswordInput, GamificationProfile, GetAdminSettings200, GetAssessmentResults200, GetAssessmentResultsParams, GetCampaignResultsParams, GetLeaderboardParams, GetTelemetryTrendsParams, HRDashboard, HealthStatus, LeaderboardResponse, LearningPath, ListAdminNotifications200Item, ListAuditLogsParams, ListCoursesParams, ListPhishingCampaignsParams, ListPhishingTemplatesParams, ListReportsParams, ListTenantsParams, ListUsersParams, LoginInput, MessageResponse, MfaSetupResponse, MfaVerifyInput, MyPhishingResults, PhishingCampaign, PhishingCampaignDetail, PhishingCampaignInput, PhishingCampaignList, PhishingGenerateInput, PhishingGenerateResult, PhishingTemplate, PhishingTemplateInput, PhishingTemplateList, PredictiveEmployeeResponse, PredictiveOrgResponse, PsychometricProfile, RecordTelemetryEvent200, RefreshTokenInput, RefreshTokenResponse, RegisterInput, ReportGenerateInput, ReportJob, SystemConfigItem, SystemConfigUpdate, SystemHealth, TelemetryEventInput, TelemetryTrendsResponse, Tenant, TenantInput, TenantList, UpdateAdminSettingBody, UpdateCourseBody, User, UserBadgeDetail, UserListResponse, UserScores, UserStats, UserUpdate } from './api.schemas';
import { customFetch } from '../custom-fetch';
import type { ErrorType, BodyType } from '../custom-fetch';
type AwaitedInput<T> = PromiseLike<T> | T;
type Awaited<O> = O extends AwaitedInput<infer T> ? T : never;
type SecondParameter<T extends (...args: never) => unknown> = Parameters<T>[1];
export declare const getHealthCheckUrl: () => string;
/**
 * @summary Health check
 */
export declare const healthCheck: (options?: RequestInit) => Promise<HealthStatus>;
export declare const getHealthCheckQueryKey: () => readonly ["/api/healthz"];
export declare const getHealthCheckQueryOptions: <TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData> & {
    queryKey: QueryKey;
};
export type HealthCheckQueryResult = NonNullable<Awaited<ReturnType<typeof healthCheck>>>;
export type HealthCheckQueryError = ErrorType<unknown>;
/**
 * @summary Health check
 */
export declare function useHealthCheck<TData = Awaited<ReturnType<typeof healthCheck>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof healthCheck>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getLoginUrl: () => string;
/**
 * @summary Login user
 */
export declare const login: (loginInput: LoginInput, options?: RequestInit) => Promise<AuthResponse>;
export declare const getLoginMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
export type LoginMutationResult = NonNullable<Awaited<ReturnType<typeof login>>>;
export type LoginMutationBody = BodyType<LoginInput>;
export type LoginMutationError = ErrorType<void>;
/**
* @summary Login user
*/
export declare const useLogin: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof login>>, TError, {
        data: BodyType<LoginInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof login>>, TError, {
    data: BodyType<LoginInput>;
}, TContext>;
export declare const getRegisterUrl: () => string;
/**
 * @summary Register new user
 */
export declare const register: (registerInput: RegisterInput, options?: RequestInit) => Promise<AuthResponse>;
export declare const getRegisterMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterInput>;
}, TContext>;
export type RegisterMutationResult = NonNullable<Awaited<ReturnType<typeof register>>>;
export type RegisterMutationBody = BodyType<RegisterInput>;
export type RegisterMutationError = ErrorType<void>;
/**
* @summary Register new user
*/
export declare const useRegister: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof register>>, TError, {
        data: BodyType<RegisterInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof register>>, TError, {
    data: BodyType<RegisterInput>;
}, TContext>;
export declare const getLogoutUrl: () => string;
/**
 * @summary Logout user
 */
export declare const logout: (options?: RequestInit) => Promise<MessageResponse>;
export declare const getLogoutMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export type LogoutMutationResult = NonNullable<Awaited<ReturnType<typeof logout>>>;
export type LogoutMutationError = ErrorType<unknown>;
/**
* @summary Logout user
*/
export declare const useLogout: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof logout>>, TError, void, TContext>;
export declare const getGetMeUrl: () => string;
/**
 * @summary Get current user
 */
export declare const getMe: (options?: RequestInit) => Promise<User>;
export declare const getGetMeQueryKey: () => readonly ["/api/auth/me"];
export declare const getGetMeQueryOptions: <TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMeQueryResult = NonNullable<Awaited<ReturnType<typeof getMe>>>;
export type GetMeQueryError = ErrorType<void>;
/**
 * @summary Get current user
 */
export declare function useGetMe<TData = Awaited<ReturnType<typeof getMe>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMe>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getRefreshTokenUrl: () => string;
/**
 * @summary Refresh access token using refresh token
 */
export declare const refreshToken: (refreshTokenInput: RefreshTokenInput, options?: RequestInit) => Promise<RefreshTokenResponse>;
export declare const getRefreshTokenMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof refreshToken>>, TError, {
        data: BodyType<RefreshTokenInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof refreshToken>>, TError, {
    data: BodyType<RefreshTokenInput>;
}, TContext>;
export type RefreshTokenMutationResult = NonNullable<Awaited<ReturnType<typeof refreshToken>>>;
export type RefreshTokenMutationBody = BodyType<RefreshTokenInput>;
export type RefreshTokenMutationError = ErrorType<void>;
/**
* @summary Refresh access token using refresh token
*/
export declare const useRefreshToken: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof refreshToken>>, TError, {
        data: BodyType<RefreshTokenInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof refreshToken>>, TError, {
    data: BodyType<RefreshTokenInput>;
}, TContext>;
export declare const getForgotPasswordUrl: () => string;
/**
 * @summary Request password reset
 */
export declare const forgotPassword: (forgotPasswordInput: ForgotPasswordInput, options?: RequestInit) => Promise<MessageResponse>;
export declare const getForgotPasswordMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof forgotPassword>>, TError, {
        data: BodyType<ForgotPasswordInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof forgotPassword>>, TError, {
    data: BodyType<ForgotPasswordInput>;
}, TContext>;
export type ForgotPasswordMutationResult = NonNullable<Awaited<ReturnType<typeof forgotPassword>>>;
export type ForgotPasswordMutationBody = BodyType<ForgotPasswordInput>;
export type ForgotPasswordMutationError = ErrorType<unknown>;
/**
* @summary Request password reset
*/
export declare const useForgotPassword: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof forgotPassword>>, TError, {
        data: BodyType<ForgotPasswordInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof forgotPassword>>, TError, {
    data: BodyType<ForgotPasswordInput>;
}, TContext>;
export declare const getSetupMfaUrl: () => string;
/**
 * @summary Setup MFA - returns TOTP secret and QR URI
 */
export declare const setupMfa: (options?: RequestInit) => Promise<MfaSetupResponse>;
export declare const getSetupMfaMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof setupMfa>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof setupMfa>>, TError, void, TContext>;
export type SetupMfaMutationResult = NonNullable<Awaited<ReturnType<typeof setupMfa>>>;
export type SetupMfaMutationError = ErrorType<unknown>;
/**
* @summary Setup MFA - returns TOTP secret and QR URI
*/
export declare const useSetupMfa: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof setupMfa>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof setupMfa>>, TError, void, TContext>;
export declare const getVerifyMfaUrl: () => string;
/**
 * @summary Verify MFA code
 */
export declare const verifyMfa: (mfaVerifyInput: MfaVerifyInput, options?: RequestInit) => Promise<MessageResponse>;
export declare const getVerifyMfaMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof verifyMfa>>, TError, {
        data: BodyType<MfaVerifyInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof verifyMfa>>, TError, {
    data: BodyType<MfaVerifyInput>;
}, TContext>;
export type VerifyMfaMutationResult = NonNullable<Awaited<ReturnType<typeof verifyMfa>>>;
export type VerifyMfaMutationBody = BodyType<MfaVerifyInput>;
export type VerifyMfaMutationError = ErrorType<void>;
/**
* @summary Verify MFA code
*/
export declare const useVerifyMfa: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof verifyMfa>>, TError, {
        data: BodyType<MfaVerifyInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof verifyMfa>>, TError, {
    data: BodyType<MfaVerifyInput>;
}, TContext>;
export declare const getListUsersUrl: (params?: ListUsersParams) => string;
/**
 * @summary List all users
 */
export declare const listUsers: (params?: ListUsersParams, options?: RequestInit) => Promise<UserListResponse>;
export declare const getListUsersQueryKey: (params?: ListUsersParams) => readonly ["/api/users", ...ListUsersParams[]];
export declare const getListUsersQueryOptions: <TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(params?: ListUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListUsersQueryResult = NonNullable<Awaited<ReturnType<typeof listUsers>>>;
export type ListUsersQueryError = ErrorType<unknown>;
/**
 * @summary List all users
 */
export declare function useListUsers<TData = Awaited<ReturnType<typeof listUsers>>, TError = ErrorType<unknown>>(params?: ListUsersParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listUsers>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetUserUrl: (id: number) => string;
/**
 * @summary Get user by ID
 */
export declare const getUser: (id: number, options?: RequestInit) => Promise<User>;
export declare const getGetUserQueryKey: (id: number) => readonly [`/api/users/${number}`];
export declare const getGetUserQueryOptions: <TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUserQueryResult = NonNullable<Awaited<ReturnType<typeof getUser>>>;
export type GetUserQueryError = ErrorType<void>;
/**
 * @summary Get user by ID
 */
export declare function useGetUser<TData = Awaited<ReturnType<typeof getUser>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUser>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateUserUrl: (id: number) => string;
/**
 * @summary Update user
 */
export declare const updateUser: (id: number, userUpdate: UserUpdate, options?: RequestInit) => Promise<User>;
export declare const getUpdateUserMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
        id: number;
        data: BodyType<UserUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
    id: number;
    data: BodyType<UserUpdate>;
}, TContext>;
export type UpdateUserMutationResult = NonNullable<Awaited<ReturnType<typeof updateUser>>>;
export type UpdateUserMutationBody = BodyType<UserUpdate>;
export type UpdateUserMutationError = ErrorType<unknown>;
/**
* @summary Update user
*/
export declare const useUpdateUser: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateUser>>, TError, {
        id: number;
        data: BodyType<UserUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateUser>>, TError, {
    id: number;
    data: BodyType<UserUpdate>;
}, TContext>;
export declare const getGetUserStatsUrl: () => string;
/**
 * @summary Get user statistics summary
 */
export declare const getUserStats: (options?: RequestInit) => Promise<UserStats>;
export declare const getGetUserStatsQueryKey: () => readonly ["/api/users/stats/summary"];
export declare const getGetUserStatsQueryOptions: <TData = Awaited<ReturnType<typeof getUserStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUserStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getUserStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetUserStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getUserStats>>>;
export type GetUserStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get user statistics summary
 */
export declare function useGetUserStats<TData = Awaited<ReturnType<typeof getUserStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getUserStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListDepartmentsUrl: () => string;
/**
 * @summary List all departments
 */
export declare const listDepartments: (options?: RequestInit) => Promise<Department[]>;
export declare const getListDepartmentsQueryKey: () => readonly ["/api/departments"];
export declare const getListDepartmentsQueryOptions: <TData = Awaited<ReturnType<typeof listDepartments>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDepartments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listDepartments>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListDepartmentsQueryResult = NonNullable<Awaited<ReturnType<typeof listDepartments>>>;
export type ListDepartmentsQueryError = ErrorType<unknown>;
/**
 * @summary List all departments
 */
export declare function useListDepartments<TData = Awaited<ReturnType<typeof listDepartments>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listDepartments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateDepartmentUrl: () => string;
/**
 * @summary Create department
 */
export declare const createDepartment: (departmentInput: DepartmentInput, options?: RequestInit) => Promise<Department>;
export declare const getCreateDepartmentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDepartment>>, TError, {
        data: BodyType<DepartmentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createDepartment>>, TError, {
    data: BodyType<DepartmentInput>;
}, TContext>;
export type CreateDepartmentMutationResult = NonNullable<Awaited<ReturnType<typeof createDepartment>>>;
export type CreateDepartmentMutationBody = BodyType<DepartmentInput>;
export type CreateDepartmentMutationError = ErrorType<unknown>;
/**
* @summary Create department
*/
export declare const useCreateDepartment: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createDepartment>>, TError, {
        data: BodyType<DepartmentInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createDepartment>>, TError, {
    data: BodyType<DepartmentInput>;
}, TContext>;
export declare const getGetDepartmentUrl: (id: number) => string;
/**
 * @summary Get department by ID
 */
export declare const getDepartment: (id: number, options?: RequestInit) => Promise<Department>;
export declare const getGetDepartmentQueryKey: (id: number) => readonly [`/api/departments/${number}`];
export declare const getGetDepartmentQueryOptions: <TData = Awaited<ReturnType<typeof getDepartment>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDepartment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getDepartment>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetDepartmentQueryResult = NonNullable<Awaited<ReturnType<typeof getDepartment>>>;
export type GetDepartmentQueryError = ErrorType<void>;
/**
 * @summary Get department by ID
 */
export declare function useGetDepartment<TData = Awaited<ReturnType<typeof getDepartment>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getDepartment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateDepartmentUrl: (id: number) => string;
/**
 * @summary Update department
 */
export declare const updateDepartment: (id: number, departmentUpdate: DepartmentUpdate, options?: RequestInit) => Promise<Department>;
export declare const getUpdateDepartmentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDepartment>>, TError, {
        id: number;
        data: BodyType<DepartmentUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateDepartment>>, TError, {
    id: number;
    data: BodyType<DepartmentUpdate>;
}, TContext>;
export type UpdateDepartmentMutationResult = NonNullable<Awaited<ReturnType<typeof updateDepartment>>>;
export type UpdateDepartmentMutationBody = BodyType<DepartmentUpdate>;
export type UpdateDepartmentMutationError = ErrorType<unknown>;
/**
* @summary Update department
*/
export declare const useUpdateDepartment: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateDepartment>>, TError, {
        id: number;
        data: BodyType<DepartmentUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateDepartment>>, TError, {
    id: number;
    data: BodyType<DepartmentUpdate>;
}, TContext>;
export declare const getDeleteDepartmentUrl: (id: number) => string;
/**
 * @summary Delete department
 */
export declare const deleteDepartment: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteDepartmentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteDepartment>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteDepartment>>, TError, {
    id: number;
}, TContext>;
export type DeleteDepartmentMutationResult = NonNullable<Awaited<ReturnType<typeof deleteDepartment>>>;
export type DeleteDepartmentMutationError = ErrorType<unknown>;
/**
* @summary Delete department
*/
export declare const useDeleteDepartment: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteDepartment>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteDepartment>>, TError, {
    id: number;
}, TContext>;
export declare const getListAssessmentsUrl: () => string;
/**
 * @summary List available assessments
 */
export declare const listAssessments: (options?: RequestInit) => Promise<Assessment[]>;
export declare const getListAssessmentsQueryKey: () => readonly ["/api/assessments"];
export declare const getListAssessmentsQueryOptions: <TData = Awaited<ReturnType<typeof listAssessments>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAssessments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAssessments>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAssessmentsQueryResult = NonNullable<Awaited<ReturnType<typeof listAssessments>>>;
export type ListAssessmentsQueryError = ErrorType<unknown>;
/**
 * @summary List available assessments
 */
export declare function useListAssessments<TData = Awaited<ReturnType<typeof listAssessments>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAssessments>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetAssessmentUrl: (id: number) => string;
/**
 * @summary Get assessment with questions
 */
export declare const getAssessment: (id: number, options?: RequestInit) => Promise<AssessmentDetail>;
export declare const getGetAssessmentQueryKey: (id: number) => readonly [`/api/assessments/${number}`];
export declare const getGetAssessmentQueryOptions: <TData = Awaited<ReturnType<typeof getAssessment>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAssessment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAssessment>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAssessmentQueryResult = NonNullable<Awaited<ReturnType<typeof getAssessment>>>;
export type GetAssessmentQueryError = ErrorType<unknown>;
/**
 * @summary Get assessment with questions
 */
export declare function useGetAssessment<TData = Awaited<ReturnType<typeof getAssessment>>, TError = ErrorType<unknown>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAssessment>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getSubmitAssessmentUrl: (id: number) => string;
/**
 * @summary Submit assessment answers
 */
export declare const submitAssessment: (id: number, assessmentSubmission: AssessmentSubmission, options?: RequestInit) => Promise<AssessmentResult>;
export declare const getSubmitAssessmentMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitAssessment>>, TError, {
        id: number;
        data: BodyType<AssessmentSubmission>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof submitAssessment>>, TError, {
    id: number;
    data: BodyType<AssessmentSubmission>;
}, TContext>;
export type SubmitAssessmentMutationResult = NonNullable<Awaited<ReturnType<typeof submitAssessment>>>;
export type SubmitAssessmentMutationBody = BodyType<AssessmentSubmission>;
export type SubmitAssessmentMutationError = ErrorType<unknown>;
/**
* @summary Submit assessment answers
*/
export declare const useSubmitAssessment: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof submitAssessment>>, TError, {
        id: number;
        data: BodyType<AssessmentSubmission>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof submitAssessment>>, TError, {
    id: number;
    data: BodyType<AssessmentSubmission>;
}, TContext>;
export declare const getGetAssessmentResultsUrl: (id: number, params?: GetAssessmentResultsParams) => string;
/**
 * @summary Get paginated employee results for an assessment
 */
export declare const getAssessmentResults: (id: number, params?: GetAssessmentResultsParams, options?: RequestInit) => Promise<GetAssessmentResults200>;
export declare const getGetAssessmentResultsQueryKey: (id: number, params?: GetAssessmentResultsParams) => readonly [`/api/admin/assessments/${number}/results`, ...GetAssessmentResultsParams[]];
export declare const getGetAssessmentResultsQueryOptions: <TData = Awaited<ReturnType<typeof getAssessmentResults>>, TError = ErrorType<unknown>>(id: number, params?: GetAssessmentResultsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAssessmentResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAssessmentResults>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAssessmentResultsQueryResult = NonNullable<Awaited<ReturnType<typeof getAssessmentResults>>>;
export type GetAssessmentResultsQueryError = ErrorType<unknown>;
/**
 * @summary Get paginated employee results for an assessment
 */
export declare function useGetAssessmentResults<TData = Awaited<ReturnType<typeof getAssessmentResults>>, TError = ErrorType<unknown>>(id: number, params?: GetAssessmentResultsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAssessmentResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetPsychometricProfileUrl: () => string;
/**
 * @summary Get current user's psychometric profile
 */
export declare const getPsychometricProfile: (options?: RequestInit) => Promise<PsychometricProfile>;
export declare const getGetPsychometricProfileQueryKey: () => readonly ["/api/assessments/profile"];
export declare const getGetPsychometricProfileQueryOptions: <TData = Awaited<ReturnType<typeof getPsychometricProfile>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPsychometricProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPsychometricProfile>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPsychometricProfileQueryResult = NonNullable<Awaited<ReturnType<typeof getPsychometricProfile>>>;
export type GetPsychometricProfileQueryError = ErrorType<void>;
/**
 * @summary Get current user's psychometric profile
 */
export declare function useGetPsychometricProfile<TData = Awaited<ReturnType<typeof getPsychometricProfile>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPsychometricProfile>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListCoursesUrl: (params?: ListCoursesParams) => string;
/**
 * @summary List courses with optional filters
 */
export declare const listCourses: (params?: ListCoursesParams, options?: RequestInit) => Promise<CourseWithProgress[]>;
export declare const getListCoursesQueryKey: (params?: ListCoursesParams) => readonly ["/api/courses", ...ListCoursesParams[]];
export declare const getListCoursesQueryOptions: <TData = Awaited<ReturnType<typeof listCourses>>, TError = ErrorType<unknown>>(params?: ListCoursesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCourses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listCourses>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListCoursesQueryResult = NonNullable<Awaited<ReturnType<typeof listCourses>>>;
export type ListCoursesQueryError = ErrorType<unknown>;
/**
 * @summary List courses with optional filters
 */
export declare function useListCourses<TData = Awaited<ReturnType<typeof listCourses>>, TError = ErrorType<unknown>>(params?: ListCoursesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listCourses>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetCourseUrl: (id: number) => string;
/**
 * @summary Get course details with lessons
 */
export declare const getCourse: (id: number, options?: RequestInit) => Promise<CourseDetail>;
export declare const getGetCourseQueryKey: (id: number) => readonly [`/api/courses/${number}`];
export declare const getGetCourseQueryOptions: <TData = Awaited<ReturnType<typeof getCourse>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCourse>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCourse>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCourseQueryResult = NonNullable<Awaited<ReturnType<typeof getCourse>>>;
export type GetCourseQueryError = ErrorType<void>;
/**
 * @summary Get course details with lessons
 */
export declare function useGetCourse<TData = Awaited<ReturnType<typeof getCourse>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCourse>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateCourseProgressUrl: (id: number) => string;
/**
 * @summary Update user's progress on a course
 */
export declare const updateCourseProgress: (id: number, courseProgressUpdate: CourseProgressUpdate, options?: RequestInit) => Promise<CourseProgress>;
export declare const getUpdateCourseProgressMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCourseProgress>>, TError, {
        id: number;
        data: BodyType<CourseProgressUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateCourseProgress>>, TError, {
    id: number;
    data: BodyType<CourseProgressUpdate>;
}, TContext>;
export type UpdateCourseProgressMutationResult = NonNullable<Awaited<ReturnType<typeof updateCourseProgress>>>;
export type UpdateCourseProgressMutationBody = BodyType<CourseProgressUpdate>;
export type UpdateCourseProgressMutationError = ErrorType<unknown>;
/**
* @summary Update user's progress on a course
*/
export declare const useUpdateCourseProgress: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCourseProgress>>, TError, {
        id: number;
        data: BodyType<CourseProgressUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateCourseProgress>>, TError, {
    id: number;
    data: BodyType<CourseProgressUpdate>;
}, TContext>;
export declare const getGetLearningPathUrl: () => string;
/**
 * @summary Get recommended learning path for current user
 */
export declare const getLearningPath: (options?: RequestInit) => Promise<LearningPath>;
export declare const getGetLearningPathQueryKey: () => readonly ["/api/courses/learning-path"];
export declare const getGetLearningPathQueryOptions: <TData = Awaited<ReturnType<typeof getLearningPath>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLearningPath>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLearningPath>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLearningPathQueryResult = NonNullable<Awaited<ReturnType<typeof getLearningPath>>>;
export type GetLearningPathQueryError = ErrorType<unknown>;
/**
 * @summary Get recommended learning path for current user
 */
export declare function useGetLearningPath<TData = Awaited<ReturnType<typeof getLearningPath>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLearningPath>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetMyScoresUrl: () => string;
/**
 * @summary Get current user's full score profile
 */
export declare const getMyScores: (options?: RequestInit) => Promise<UserScores>;
export declare const getGetMyScoresQueryKey: () => readonly ["/api/scores/me"];
export declare const getGetMyScoresQueryOptions: <TData = Awaited<ReturnType<typeof getMyScores>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyScores>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyScores>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyScoresQueryResult = NonNullable<Awaited<ReturnType<typeof getMyScores>>>;
export type GetMyScoresQueryError = ErrorType<unknown>;
/**
 * @summary Get current user's full score profile
 */
export declare function useGetMyScores<TData = Awaited<ReturnType<typeof getMyScores>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyScores>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetCciHistoryUrl: () => string;
/**
 * @summary Get CCI and HRS historical snapshots for trend chart
 */
export declare const getCciHistory: (options?: RequestInit) => Promise<CciHistory>;
export declare const getGetCciHistoryQueryKey: () => readonly ["/api/scores/cci-history"];
export declare const getGetCciHistoryQueryOptions: <TData = Awaited<ReturnType<typeof getCciHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCciHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCciHistory>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCciHistoryQueryResult = NonNullable<Awaited<ReturnType<typeof getCciHistory>>>;
export type GetCciHistoryQueryError = ErrorType<unknown>;
/**
 * @summary Get CCI and HRS historical snapshots for trend chart
 */
export declare function useGetCciHistory<TData = Awaited<ReturnType<typeof getCciHistory>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCciHistory>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetLeaderboardUrl: (params?: GetLeaderboardParams) => string;
/**
 * @summary Get XP leaderboard
 */
export declare const getLeaderboard: (params?: GetLeaderboardParams, options?: RequestInit) => Promise<LeaderboardResponse>;
export declare const getGetLeaderboardQueryKey: (params?: GetLeaderboardParams) => readonly ["/api/leaderboard", ...GetLeaderboardParams[]];
export declare const getGetLeaderboardQueryOptions: <TData = Awaited<ReturnType<typeof getLeaderboard>>, TError = ErrorType<unknown>>(params?: GetLeaderboardParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLeaderboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getLeaderboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetLeaderboardQueryResult = NonNullable<Awaited<ReturnType<typeof getLeaderboard>>>;
export type GetLeaderboardQueryError = ErrorType<unknown>;
/**
 * @summary Get XP leaderboard
 */
export declare function useGetLeaderboard<TData = Awaited<ReturnType<typeof getLeaderboard>>, TError = ErrorType<unknown>>(params?: GetLeaderboardParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getLeaderboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetMyGamificationUrl: () => string;
/**
 * @summary Get current user's gamification profile
 */
export declare const getMyGamification: (options?: RequestInit) => Promise<GamificationProfile>;
export declare const getGetMyGamificationQueryKey: () => readonly ["/api/gamification/me"];
export declare const getGetMyGamificationQueryOptions: <TData = Awaited<ReturnType<typeof getMyGamification>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyGamification>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyGamification>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyGamificationQueryResult = NonNullable<Awaited<ReturnType<typeof getMyGamification>>>;
export type GetMyGamificationQueryError = ErrorType<unknown>;
/**
 * @summary Get current user's gamification profile
 */
export declare function useGetMyGamification<TData = Awaited<ReturnType<typeof getMyGamification>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyGamification>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetMyBadgesUrl: () => string;
/**
 * @summary Get current user's earned badges
 */
export declare const getMyBadges: (options?: RequestInit) => Promise<UserBadgeDetail[]>;
export declare const getGetMyBadgesQueryKey: () => readonly ["/api/gamification/badges"];
export declare const getGetMyBadgesQueryOptions: <TData = Awaited<ReturnType<typeof getMyBadges>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyBadges>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyBadges>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyBadgesQueryResult = NonNullable<Awaited<ReturnType<typeof getMyBadges>>>;
export type GetMyBadgesQueryError = ErrorType<unknown>;
/**
 * @summary Get current user's earned badges
 */
export declare function useGetMyBadges<TData = Awaited<ReturnType<typeof getMyBadges>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyBadges>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCompleteOnboardingUrl: () => string;
/**
 * @summary Mark onboarding wizard as completed
 */
export declare const completeOnboarding: (options?: RequestInit) => Promise<CompleteOnboarding200>;
export declare const getCompleteOnboardingMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeOnboarding>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof completeOnboarding>>, TError, void, TContext>;
export type CompleteOnboardingMutationResult = NonNullable<Awaited<ReturnType<typeof completeOnboarding>>>;
export type CompleteOnboardingMutationError = ErrorType<unknown>;
/**
* @summary Mark onboarding wizard as completed
*/
export declare const useCompleteOnboarding: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof completeOnboarding>>, TError, void, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof completeOnboarding>>, TError, void, TContext>;
export declare const getRecordTelemetryEventUrl: () => string;
/**
 * @summary Record a behavioral telemetry event
 */
export declare const recordTelemetryEvent: (telemetryEventInput: TelemetryEventInput, options?: RequestInit) => Promise<RecordTelemetryEvent200>;
export declare const getRecordTelemetryEventMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof recordTelemetryEvent>>, TError, {
        data: BodyType<TelemetryEventInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof recordTelemetryEvent>>, TError, {
    data: BodyType<TelemetryEventInput>;
}, TContext>;
export type RecordTelemetryEventMutationResult = NonNullable<Awaited<ReturnType<typeof recordTelemetryEvent>>>;
export type RecordTelemetryEventMutationBody = BodyType<TelemetryEventInput>;
export type RecordTelemetryEventMutationError = ErrorType<unknown>;
/**
* @summary Record a behavioral telemetry event
*/
export declare const useRecordTelemetryEvent: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof recordTelemetryEvent>>, TError, {
        data: BodyType<TelemetryEventInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof recordTelemetryEvent>>, TError, {
    data: BodyType<TelemetryEventInput>;
}, TContext>;
export declare const getListPhishingTemplatesUrl: (params?: ListPhishingTemplatesParams) => string;
/**
 * @summary List phishing templates
 */
export declare const listPhishingTemplates: (params?: ListPhishingTemplatesParams, options?: RequestInit) => Promise<PhishingTemplateList>;
export declare const getListPhishingTemplatesQueryKey: (params?: ListPhishingTemplatesParams) => readonly ["/api/phishing/templates", ...ListPhishingTemplatesParams[]];
export declare const getListPhishingTemplatesQueryOptions: <TData = Awaited<ReturnType<typeof listPhishingTemplates>>, TError = ErrorType<unknown>>(params?: ListPhishingTemplatesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPhishingTemplates>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPhishingTemplates>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPhishingTemplatesQueryResult = NonNullable<Awaited<ReturnType<typeof listPhishingTemplates>>>;
export type ListPhishingTemplatesQueryError = ErrorType<unknown>;
/**
 * @summary List phishing templates
 */
export declare function useListPhishingTemplates<TData = Awaited<ReturnType<typeof listPhishingTemplates>>, TError = ErrorType<unknown>>(params?: ListPhishingTemplatesParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPhishingTemplates>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreatePhishingTemplateUrl: () => string;
/**
 * @summary Create a phishing template
 */
export declare const createPhishingTemplate: (phishingTemplateInput: PhishingTemplateInput, options?: RequestInit) => Promise<PhishingTemplate>;
export declare const getCreatePhishingTemplateMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPhishingTemplate>>, TError, {
        data: BodyType<PhishingTemplateInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createPhishingTemplate>>, TError, {
    data: BodyType<PhishingTemplateInput>;
}, TContext>;
export type CreatePhishingTemplateMutationResult = NonNullable<Awaited<ReturnType<typeof createPhishingTemplate>>>;
export type CreatePhishingTemplateMutationBody = BodyType<PhishingTemplateInput>;
export type CreatePhishingTemplateMutationError = ErrorType<unknown>;
/**
* @summary Create a phishing template
*/
export declare const useCreatePhishingTemplate: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPhishingTemplate>>, TError, {
        data: BodyType<PhishingTemplateInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createPhishingTemplate>>, TError, {
    data: BodyType<PhishingTemplateInput>;
}, TContext>;
export declare const getGeneratePhishingTemplateUrl: () => string;
/**
 * @summary AI-generate a phishing template (mock)
 */
export declare const generatePhishingTemplate: (phishingGenerateInput: PhishingGenerateInput, options?: RequestInit) => Promise<PhishingGenerateResult>;
export declare const getGeneratePhishingTemplateMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generatePhishingTemplate>>, TError, {
        data: BodyType<PhishingGenerateInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof generatePhishingTemplate>>, TError, {
    data: BodyType<PhishingGenerateInput>;
}, TContext>;
export type GeneratePhishingTemplateMutationResult = NonNullable<Awaited<ReturnType<typeof generatePhishingTemplate>>>;
export type GeneratePhishingTemplateMutationBody = BodyType<PhishingGenerateInput>;
export type GeneratePhishingTemplateMutationError = ErrorType<unknown>;
/**
* @summary AI-generate a phishing template (mock)
*/
export declare const useGeneratePhishingTemplate: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generatePhishingTemplate>>, TError, {
        data: BodyType<PhishingGenerateInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof generatePhishingTemplate>>, TError, {
    data: BodyType<PhishingGenerateInput>;
}, TContext>;
export declare const getGetPhishingTemplateUrl: (id: number) => string;
/**
 * @summary Get phishing template by ID
 */
export declare const getPhishingTemplate: (id: number, options?: RequestInit) => Promise<PhishingTemplate>;
export declare const getGetPhishingTemplateQueryKey: (id: number) => readonly [`/api/phishing/templates/${number}`];
export declare const getGetPhishingTemplateQueryOptions: <TData = Awaited<ReturnType<typeof getPhishingTemplate>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPhishingTemplate>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPhishingTemplate>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPhishingTemplateQueryResult = NonNullable<Awaited<ReturnType<typeof getPhishingTemplate>>>;
export type GetPhishingTemplateQueryError = ErrorType<void>;
/**
 * @summary Get phishing template by ID
 */
export declare function useGetPhishingTemplate<TData = Awaited<ReturnType<typeof getPhishingTemplate>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPhishingTemplate>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdatePhishingTemplateUrl: (id: number) => string;
/**
 * @summary Update phishing template
 */
export declare const updatePhishingTemplate: (id: number, phishingTemplateInput: PhishingTemplateInput, options?: RequestInit) => Promise<PhishingTemplate>;
export declare const getUpdatePhishingTemplateMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePhishingTemplate>>, TError, {
        id: number;
        data: BodyType<PhishingTemplateInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updatePhishingTemplate>>, TError, {
    id: number;
    data: BodyType<PhishingTemplateInput>;
}, TContext>;
export type UpdatePhishingTemplateMutationResult = NonNullable<Awaited<ReturnType<typeof updatePhishingTemplate>>>;
export type UpdatePhishingTemplateMutationBody = BodyType<PhishingTemplateInput>;
export type UpdatePhishingTemplateMutationError = ErrorType<unknown>;
/**
* @summary Update phishing template
*/
export declare const useUpdatePhishingTemplate: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePhishingTemplate>>, TError, {
        id: number;
        data: BodyType<PhishingTemplateInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updatePhishingTemplate>>, TError, {
    id: number;
    data: BodyType<PhishingTemplateInput>;
}, TContext>;
export declare const getDeletePhishingTemplateUrl: (id: number) => string;
/**
 * @summary Delete phishing template
 */
export declare const deletePhishingTemplate: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeletePhishingTemplateMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePhishingTemplate>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deletePhishingTemplate>>, TError, {
    id: number;
}, TContext>;
export type DeletePhishingTemplateMutationResult = NonNullable<Awaited<ReturnType<typeof deletePhishingTemplate>>>;
export type DeletePhishingTemplateMutationError = ErrorType<unknown>;
/**
* @summary Delete phishing template
*/
export declare const useDeletePhishingTemplate: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePhishingTemplate>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deletePhishingTemplate>>, TError, {
    id: number;
}, TContext>;
export declare const getListPhishingCampaignsUrl: (params?: ListPhishingCampaignsParams) => string;
/**
 * @summary List phishing campaigns
 */
export declare const listPhishingCampaigns: (params?: ListPhishingCampaignsParams, options?: RequestInit) => Promise<PhishingCampaignList>;
export declare const getListPhishingCampaignsQueryKey: (params?: ListPhishingCampaignsParams) => readonly ["/api/phishing/campaigns", ...ListPhishingCampaignsParams[]];
export declare const getListPhishingCampaignsQueryOptions: <TData = Awaited<ReturnType<typeof listPhishingCampaigns>>, TError = ErrorType<unknown>>(params?: ListPhishingCampaignsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPhishingCampaigns>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listPhishingCampaigns>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListPhishingCampaignsQueryResult = NonNullable<Awaited<ReturnType<typeof listPhishingCampaigns>>>;
export type ListPhishingCampaignsQueryError = ErrorType<unknown>;
/**
 * @summary List phishing campaigns
 */
export declare function useListPhishingCampaigns<TData = Awaited<ReturnType<typeof listPhishingCampaigns>>, TError = ErrorType<unknown>>(params?: ListPhishingCampaignsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listPhishingCampaigns>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreatePhishingCampaignUrl: () => string;
/**
 * @summary Create a phishing campaign
 */
export declare const createPhishingCampaign: (phishingCampaignInput: PhishingCampaignInput, options?: RequestInit) => Promise<PhishingCampaign>;
export declare const getCreatePhishingCampaignMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPhishingCampaign>>, TError, {
        data: BodyType<PhishingCampaignInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createPhishingCampaign>>, TError, {
    data: BodyType<PhishingCampaignInput>;
}, TContext>;
export type CreatePhishingCampaignMutationResult = NonNullable<Awaited<ReturnType<typeof createPhishingCampaign>>>;
export type CreatePhishingCampaignMutationBody = BodyType<PhishingCampaignInput>;
export type CreatePhishingCampaignMutationError = ErrorType<unknown>;
/**
* @summary Create a phishing campaign
*/
export declare const useCreatePhishingCampaign: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createPhishingCampaign>>, TError, {
        data: BodyType<PhishingCampaignInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createPhishingCampaign>>, TError, {
    data: BodyType<PhishingCampaignInput>;
}, TContext>;
export declare const getGetPhishingCampaignUrl: (id: number) => string;
/**
 * @summary Get campaign by ID
 */
export declare const getPhishingCampaign: (id: number, options?: RequestInit) => Promise<PhishingCampaignDetail>;
export declare const getGetPhishingCampaignQueryKey: (id: number) => readonly [`/api/phishing/campaigns/${number}`];
export declare const getGetPhishingCampaignQueryOptions: <TData = Awaited<ReturnType<typeof getPhishingCampaign>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPhishingCampaign>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPhishingCampaign>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPhishingCampaignQueryResult = NonNullable<Awaited<ReturnType<typeof getPhishingCampaign>>>;
export type GetPhishingCampaignQueryError = ErrorType<void>;
/**
 * @summary Get campaign by ID
 */
export declare function useGetPhishingCampaign<TData = Awaited<ReturnType<typeof getPhishingCampaign>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPhishingCampaign>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdatePhishingCampaignUrl: (id: number) => string;
/**
 * @summary Update campaign
 */
export declare const updatePhishingCampaign: (id: number, phishingCampaignInput: PhishingCampaignInput, options?: RequestInit) => Promise<PhishingCampaign>;
export declare const getUpdatePhishingCampaignMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePhishingCampaign>>, TError, {
        id: number;
        data: BodyType<PhishingCampaignInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updatePhishingCampaign>>, TError, {
    id: number;
    data: BodyType<PhishingCampaignInput>;
}, TContext>;
export type UpdatePhishingCampaignMutationResult = NonNullable<Awaited<ReturnType<typeof updatePhishingCampaign>>>;
export type UpdatePhishingCampaignMutationBody = BodyType<PhishingCampaignInput>;
export type UpdatePhishingCampaignMutationError = ErrorType<unknown>;
/**
* @summary Update campaign
*/
export declare const useUpdatePhishingCampaign: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updatePhishingCampaign>>, TError, {
        id: number;
        data: BodyType<PhishingCampaignInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updatePhishingCampaign>>, TError, {
    id: number;
    data: BodyType<PhishingCampaignInput>;
}, TContext>;
export declare const getDeletePhishingCampaignUrl: (id: number) => string;
/**
 * @summary Delete campaign
 */
export declare const deletePhishingCampaign: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeletePhishingCampaignMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePhishingCampaign>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deletePhishingCampaign>>, TError, {
    id: number;
}, TContext>;
export type DeletePhishingCampaignMutationResult = NonNullable<Awaited<ReturnType<typeof deletePhishingCampaign>>>;
export type DeletePhishingCampaignMutationError = ErrorType<unknown>;
/**
* @summary Delete campaign
*/
export declare const useDeletePhishingCampaign: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deletePhishingCampaign>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deletePhishingCampaign>>, TError, {
    id: number;
}, TContext>;
export declare const getLaunchPhishingCampaignUrl: (id: number) => string;
/**
 * @summary Launch a campaign
 */
export declare const launchPhishingCampaign: (id: number, options?: RequestInit) => Promise<PhishingCampaign>;
export declare const getLaunchPhishingCampaignMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof launchPhishingCampaign>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof launchPhishingCampaign>>, TError, {
    id: number;
}, TContext>;
export type LaunchPhishingCampaignMutationResult = NonNullable<Awaited<ReturnType<typeof launchPhishingCampaign>>>;
export type LaunchPhishingCampaignMutationError = ErrorType<unknown>;
/**
* @summary Launch a campaign
*/
export declare const useLaunchPhishingCampaign: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof launchPhishingCampaign>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof launchPhishingCampaign>>, TError, {
    id: number;
}, TContext>;
export declare const getGetCampaignResultsUrl: (id: number, params?: GetCampaignResultsParams) => string;
/**
 * @summary Get per-employee results for a campaign
 */
export declare const getCampaignResults: (id: number, params?: GetCampaignResultsParams, options?: RequestInit) => Promise<CampaignResultsList>;
export declare const getGetCampaignResultsQueryKey: (id: number, params?: GetCampaignResultsParams) => readonly [`/api/phishing/campaigns/${number}/results`, ...GetCampaignResultsParams[]];
export declare const getGetCampaignResultsQueryOptions: <TData = Awaited<ReturnType<typeof getCampaignResults>>, TError = ErrorType<unknown>>(id: number, params?: GetCampaignResultsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCampaignResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getCampaignResults>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetCampaignResultsQueryResult = NonNullable<Awaited<ReturnType<typeof getCampaignResults>>>;
export type GetCampaignResultsQueryError = ErrorType<unknown>;
/**
 * @summary Get per-employee results for a campaign
 */
export declare function useGetCampaignResults<TData = Awaited<ReturnType<typeof getCampaignResults>>, TError = ErrorType<unknown>>(id: number, params?: GetCampaignResultsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getCampaignResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetMyPhishingResultsUrl: () => string;
/**
 * @summary Get current employee's phishing result history
 */
export declare const getMyPhishingResults: (options?: RequestInit) => Promise<MyPhishingResults>;
export declare const getGetMyPhishingResultsQueryKey: () => readonly ["/api/phishing/my-results"];
export declare const getGetMyPhishingResultsQueryOptions: <TData = Awaited<ReturnType<typeof getMyPhishingResults>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyPhishingResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getMyPhishingResults>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetMyPhishingResultsQueryResult = NonNullable<Awaited<ReturnType<typeof getMyPhishingResults>>>;
export type GetMyPhishingResultsQueryError = ErrorType<unknown>;
/**
 * @summary Get current employee's phishing result history
 */
export declare function useGetMyPhishingResults<TData = Awaited<ReturnType<typeof getMyPhishingResults>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getMyPhishingResults>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListReportsUrl: (params?: ListReportsParams) => string;
/**
 * @summary List report jobs
 */
export declare const listReports: (params?: ListReportsParams, options?: RequestInit) => Promise<ReportJob[]>;
export declare const getListReportsQueryKey: (params?: ListReportsParams) => readonly ["/api/reports", ...ListReportsParams[]];
export declare const getListReportsQueryOptions: <TData = Awaited<ReturnType<typeof listReports>>, TError = ErrorType<unknown>>(params?: ListReportsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listReports>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listReports>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListReportsQueryResult = NonNullable<Awaited<ReturnType<typeof listReports>>>;
export type ListReportsQueryError = ErrorType<unknown>;
/**
 * @summary List report jobs
 */
export declare function useListReports<TData = Awaited<ReturnType<typeof listReports>>, TError = ErrorType<unknown>>(params?: ListReportsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listReports>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGenerateReportUrl: () => string;
/**
 * @summary Generate a report
 */
export declare const generateReport: (reportGenerateInput: ReportGenerateInput, options?: RequestInit) => Promise<ReportJob>;
export declare const getGenerateReportMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateReport>>, TError, {
        data: BodyType<ReportGenerateInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof generateReport>>, TError, {
    data: BodyType<ReportGenerateInput>;
}, TContext>;
export type GenerateReportMutationResult = NonNullable<Awaited<ReturnType<typeof generateReport>>>;
export type GenerateReportMutationBody = BodyType<ReportGenerateInput>;
export type GenerateReportMutationError = ErrorType<unknown>;
/**
* @summary Generate a report
*/
export declare const useGenerateReport: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof generateReport>>, TError, {
        data: BodyType<ReportGenerateInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof generateReport>>, TError, {
    data: BodyType<ReportGenerateInput>;
}, TContext>;
export declare const getDownloadReportUrl: (id: number) => string;
/**
 * @summary Download a report file
 */
export declare const downloadReport: (id: number, options?: RequestInit) => Promise<ReportJob>;
export declare const getDownloadReportQueryKey: (id: number) => readonly [`/api/reports/${number}/download`];
export declare const getDownloadReportQueryOptions: <TData = Awaited<ReturnType<typeof downloadReport>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof downloadReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof downloadReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type DownloadReportQueryResult = NonNullable<Awaited<ReturnType<typeof downloadReport>>>;
export type DownloadReportQueryError = ErrorType<void>;
/**
 * @summary Download a report file
 */
export declare function useDownloadReport<TData = Awaited<ReturnType<typeof downloadReport>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof downloadReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetAdminStatsUrl: () => string;
/**
 * @summary Get platform-wide admin statistics
 */
export declare const getAdminStats: (options?: RequestInit) => Promise<AdminStats>;
export declare const getGetAdminStatsQueryKey: () => readonly ["/api/admin/stats"];
export declare const getGetAdminStatsQueryOptions: <TData = Awaited<ReturnType<typeof getAdminStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminStats>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAdminStatsQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminStats>>>;
export type GetAdminStatsQueryError = ErrorType<unknown>;
/**
 * @summary Get platform-wide admin statistics
 */
export declare function useGetAdminStats<TData = Awaited<ReturnType<typeof getAdminStats>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminStats>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListTenantsUrl: (params?: ListTenantsParams) => string;
/**
 * @summary List all tenants
 */
export declare const listTenants: (params?: ListTenantsParams, options?: RequestInit) => Promise<TenantList>;
export declare const getListTenantsQueryKey: (params?: ListTenantsParams) => readonly ["/api/tenants", ...ListTenantsParams[]];
export declare const getListTenantsQueryOptions: <TData = Awaited<ReturnType<typeof listTenants>>, TError = ErrorType<unknown>>(params?: ListTenantsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTenants>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listTenants>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListTenantsQueryResult = NonNullable<Awaited<ReturnType<typeof listTenants>>>;
export type ListTenantsQueryError = ErrorType<unknown>;
/**
 * @summary List all tenants
 */
export declare function useListTenants<TData = Awaited<ReturnType<typeof listTenants>>, TError = ErrorType<unknown>>(params?: ListTenantsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listTenants>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateTenantUrl: () => string;
/**
 * @summary Create a new tenant
 */
export declare const createTenant: (tenantInput: TenantInput, options?: RequestInit) => Promise<Tenant>;
export declare const getCreateTenantMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTenant>>, TError, {
        data: BodyType<TenantInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createTenant>>, TError, {
    data: BodyType<TenantInput>;
}, TContext>;
export type CreateTenantMutationResult = NonNullable<Awaited<ReturnType<typeof createTenant>>>;
export type CreateTenantMutationBody = BodyType<TenantInput>;
export type CreateTenantMutationError = ErrorType<unknown>;
/**
* @summary Create a new tenant
*/
export declare const useCreateTenant: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createTenant>>, TError, {
        data: BodyType<TenantInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createTenant>>, TError, {
    data: BodyType<TenantInput>;
}, TContext>;
export declare const getGetTenantUrl: (id: number) => string;
/**
 * @summary Get tenant by ID
 */
export declare const getTenant: (id: number, options?: RequestInit) => Promise<Tenant>;
export declare const getGetTenantQueryKey: (id: number) => readonly [`/api/tenants/${number}`];
export declare const getGetTenantQueryOptions: <TData = Awaited<ReturnType<typeof getTenant>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTenant>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTenant>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTenantQueryResult = NonNullable<Awaited<ReturnType<typeof getTenant>>>;
export type GetTenantQueryError = ErrorType<void>;
/**
 * @summary Get tenant by ID
 */
export declare function useGetTenant<TData = Awaited<ReturnType<typeof getTenant>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTenant>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateTenantUrl: (id: number) => string;
/**
 * @summary Update tenant
 */
export declare const updateTenant: (id: number, tenantInput: TenantInput, options?: RequestInit) => Promise<Tenant>;
export declare const getUpdateTenantMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTenant>>, TError, {
        id: number;
        data: BodyType<TenantInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateTenant>>, TError, {
    id: number;
    data: BodyType<TenantInput>;
}, TContext>;
export type UpdateTenantMutationResult = NonNullable<Awaited<ReturnType<typeof updateTenant>>>;
export type UpdateTenantMutationBody = BodyType<TenantInput>;
export type UpdateTenantMutationError = ErrorType<unknown>;
/**
* @summary Update tenant
*/
export declare const useUpdateTenant: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateTenant>>, TError, {
        id: number;
        data: BodyType<TenantInput>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateTenant>>, TError, {
    id: number;
    data: BodyType<TenantInput>;
}, TContext>;
export declare const getGetSystemConfigUrl: () => string;
/**
 * @summary Get all system configuration values
 */
export declare const getSystemConfig: (options?: RequestInit) => Promise<SystemConfigItem[]>;
export declare const getGetSystemConfigQueryKey: () => readonly ["/api/system/config"];
export declare const getGetSystemConfigQueryOptions: <TData = Awaited<ReturnType<typeof getSystemConfig>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSystemConfig>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSystemConfig>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSystemConfigQueryResult = NonNullable<Awaited<ReturnType<typeof getSystemConfig>>>;
export type GetSystemConfigQueryError = ErrorType<unknown>;
/**
 * @summary Get all system configuration values
 */
export declare function useGetSystemConfig<TData = Awaited<ReturnType<typeof getSystemConfig>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSystemConfig>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateSystemConfigUrl: () => string;
/**
 * @summary Update system configuration
 */
export declare const updateSystemConfig: (systemConfigUpdate: SystemConfigUpdate, options?: RequestInit) => Promise<SystemConfigItem>;
export declare const getUpdateSystemConfigMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSystemConfig>>, TError, {
        data: BodyType<SystemConfigUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateSystemConfig>>, TError, {
    data: BodyType<SystemConfigUpdate>;
}, TContext>;
export type UpdateSystemConfigMutationResult = NonNullable<Awaited<ReturnType<typeof updateSystemConfig>>>;
export type UpdateSystemConfigMutationBody = BodyType<SystemConfigUpdate>;
export type UpdateSystemConfigMutationError = ErrorType<unknown>;
/**
* @summary Update system configuration
*/
export declare const useUpdateSystemConfig: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateSystemConfig>>, TError, {
        data: BodyType<SystemConfigUpdate>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateSystemConfig>>, TError, {
    data: BodyType<SystemConfigUpdate>;
}, TContext>;
export declare const getGetSystemHealthUrl: () => string;
/**
 * @summary Get system health and monitoring metrics
 */
export declare const getSystemHealth: (options?: RequestInit) => Promise<SystemHealth>;
export declare const getGetSystemHealthQueryKey: () => readonly ["/api/system/health"];
export declare const getGetSystemHealthQueryOptions: <TData = Awaited<ReturnType<typeof getSystemHealth>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSystemHealth>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getSystemHealth>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetSystemHealthQueryResult = NonNullable<Awaited<ReturnType<typeof getSystemHealth>>>;
export type GetSystemHealthQueryError = ErrorType<unknown>;
/**
 * @summary Get system health and monitoring metrics
 */
export declare function useGetSystemHealth<TData = Awaited<ReturnType<typeof getSystemHealth>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getSystemHealth>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getListAuditLogsUrl: (params?: ListAuditLogsParams) => string;
/**
 * @summary List audit log events
 */
export declare const listAuditLogs: (params?: ListAuditLogsParams, options?: RequestInit) => Promise<AuditLogList>;
export declare const getListAuditLogsQueryKey: (params?: ListAuditLogsParams) => readonly ["/api/audit-logs", ...ListAuditLogsParams[]];
export declare const getListAuditLogsQueryOptions: <TData = Awaited<ReturnType<typeof listAuditLogs>>, TError = ErrorType<unknown>>(params?: ListAuditLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAuditLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAuditLogs>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAuditLogsQueryResult = NonNullable<Awaited<ReturnType<typeof listAuditLogs>>>;
export type ListAuditLogsQueryError = ErrorType<unknown>;
/**
 * @summary List audit log events
 */
export declare function useListAuditLogs<TData = Awaited<ReturnType<typeof listAuditLogs>>, TError = ErrorType<unknown>>(params?: ListAuditLogsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAuditLogs>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetTelemetryTrendsUrl: (params?: GetTelemetryTrendsParams) => string;
/**
 * @summary Get current user's behavioral telemetry trends
 */
export declare const getTelemetryTrends: (params?: GetTelemetryTrendsParams, options?: RequestInit) => Promise<TelemetryTrendsResponse>;
export declare const getGetTelemetryTrendsQueryKey: (params?: GetTelemetryTrendsParams) => readonly ["/api/telemetry/trends", ...GetTelemetryTrendsParams[]];
export declare const getGetTelemetryTrendsQueryOptions: <TData = Awaited<ReturnType<typeof getTelemetryTrends>>, TError = ErrorType<unknown>>(params?: GetTelemetryTrendsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTelemetryTrends>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getTelemetryTrends>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetTelemetryTrendsQueryResult = NonNullable<Awaited<ReturnType<typeof getTelemetryTrends>>>;
export type GetTelemetryTrendsQueryError = ErrorType<unknown>;
/**
 * @summary Get current user's behavioral telemetry trends
 */
export declare function useGetTelemetryTrends<TData = Awaited<ReturnType<typeof getTelemetryTrends>>, TError = ErrorType<unknown>>(params?: GetTelemetryTrendsParams, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getTelemetryTrends>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getDeleteUserUrl: (id: number) => string;
/**
 * @summary Delete a user (admin only)
 */
export declare const deleteUser: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteUserMutationOptions: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError, {
    id: number;
}, TContext>;
export type DeleteUserMutationResult = NonNullable<Awaited<ReturnType<typeof deleteUser>>>;
export type DeleteUserMutationError = ErrorType<void>;
/**
* @summary Delete a user (admin only)
*/
export declare const useDeleteUser: <TError = ErrorType<void>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteUser>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteUser>>, TError, {
    id: number;
}, TContext>;
export declare const getUpdateCourseUrl: (id: number) => string;
/**
 * @summary Update a course (admin only)
 */
export declare const updateCourse: (id: number, updateCourseBody: UpdateCourseBody, options?: RequestInit) => Promise<Course>;
export declare const getUpdateCourseMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCourse>>, TError, {
        id: number;
        data: BodyType<UpdateCourseBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateCourse>>, TError, {
    id: number;
    data: BodyType<UpdateCourseBody>;
}, TContext>;
export type UpdateCourseMutationResult = NonNullable<Awaited<ReturnType<typeof updateCourse>>>;
export type UpdateCourseMutationBody = BodyType<UpdateCourseBody>;
export type UpdateCourseMutationError = ErrorType<unknown>;
/**
* @summary Update a course (admin only)
*/
export declare const useUpdateCourse: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateCourse>>, TError, {
        id: number;
        data: BodyType<UpdateCourseBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateCourse>>, TError, {
    id: number;
    data: BodyType<UpdateCourseBody>;
}, TContext>;
export declare const getDeleteCourseUrl: (id: number) => string;
/**
 * @summary Delete a course (admin only)
 */
export declare const deleteCourse: (id: number, options?: RequestInit) => Promise<void>;
export declare const getDeleteCourseMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCourse>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteCourse>>, TError, {
    id: number;
}, TContext>;
export type DeleteCourseMutationResult = NonNullable<Awaited<ReturnType<typeof deleteCourse>>>;
export type DeleteCourseMutationError = ErrorType<unknown>;
/**
* @summary Delete a course (admin only)
*/
export declare const useDeleteCourse: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteCourse>>, TError, {
        id: number;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteCourse>>, TError, {
    id: number;
}, TContext>;
export declare const getGetAdminSettingsUrl: () => string;
/**
 * @summary Get all admin settings from system config
 */
export declare const getAdminSettings: (options?: RequestInit) => Promise<GetAdminSettings200>;
export declare const getGetAdminSettingsQueryKey: () => readonly ["/api/admin/settings"];
export declare const getGetAdminSettingsQueryOptions: <TData = Awaited<ReturnType<typeof getAdminSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getAdminSettings>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetAdminSettingsQueryResult = NonNullable<Awaited<ReturnType<typeof getAdminSettings>>>;
export type GetAdminSettingsQueryError = ErrorType<unknown>;
/**
 * @summary Get all admin settings from system config
 */
export declare function useGetAdminSettings<TData = Awaited<ReturnType<typeof getAdminSettings>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getAdminSettings>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getUpdateAdminSettingUrl: (key: string) => string;
/**
 * @summary Update a single admin setting
 */
export declare const updateAdminSetting: (key: string, updateAdminSettingBody: UpdateAdminSettingBody, options?: RequestInit) => Promise<void>;
export declare const getUpdateAdminSettingMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAdminSetting>>, TError, {
        key: string;
        data: BodyType<UpdateAdminSettingBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof updateAdminSetting>>, TError, {
    key: string;
    data: BodyType<UpdateAdminSettingBody>;
}, TContext>;
export type UpdateAdminSettingMutationResult = NonNullable<Awaited<ReturnType<typeof updateAdminSetting>>>;
export type UpdateAdminSettingMutationBody = BodyType<UpdateAdminSettingBody>;
export type UpdateAdminSettingMutationError = ErrorType<unknown>;
/**
* @summary Update a single admin setting
*/
export declare const useUpdateAdminSetting: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof updateAdminSetting>>, TError, {
        key: string;
        data: BodyType<UpdateAdminSettingBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof updateAdminSetting>>, TError, {
    key: string;
    data: BodyType<UpdateAdminSettingBody>;
}, TContext>;
export declare const getListAdminNotificationsUrl: () => string;
/**
 * @summary List platform announcements
 */
export declare const listAdminNotifications: (options?: RequestInit) => Promise<ListAdminNotifications200Item[]>;
export declare const getListAdminNotificationsQueryKey: () => readonly ["/api/admin/notifications"];
export declare const getListAdminNotificationsQueryOptions: <TData = Awaited<ReturnType<typeof listAdminNotifications>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAdminNotifications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof listAdminNotifications>>, TError, TData> & {
    queryKey: QueryKey;
};
export type ListAdminNotificationsQueryResult = NonNullable<Awaited<ReturnType<typeof listAdminNotifications>>>;
export type ListAdminNotificationsQueryError = ErrorType<unknown>;
/**
 * @summary List platform announcements
 */
export declare function useListAdminNotifications<TData = Awaited<ReturnType<typeof listAdminNotifications>>, TError = ErrorType<unknown>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof listAdminNotifications>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getCreateAdminNotificationUrl: () => string;
/**
 * @summary Create a new announcement
 */
export declare const createAdminNotification: (createAdminNotificationBody: CreateAdminNotificationBody, options?: RequestInit) => Promise<void>;
export declare const getCreateAdminNotificationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAdminNotification>>, TError, {
        data: BodyType<CreateAdminNotificationBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof createAdminNotification>>, TError, {
    data: BodyType<CreateAdminNotificationBody>;
}, TContext>;
export type CreateAdminNotificationMutationResult = NonNullable<Awaited<ReturnType<typeof createAdminNotification>>>;
export type CreateAdminNotificationMutationBody = BodyType<CreateAdminNotificationBody>;
export type CreateAdminNotificationMutationError = ErrorType<unknown>;
/**
* @summary Create a new announcement
*/
export declare const useCreateAdminNotification: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof createAdminNotification>>, TError, {
        data: BodyType<CreateAdminNotificationBody>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof createAdminNotification>>, TError, {
    data: BodyType<CreateAdminNotificationBody>;
}, TContext>;
export declare const getDeleteAdminNotificationUrl: (id: string) => string;
/**
 * @summary Remove an announcement
 */
export declare const deleteAdminNotification: (id: string, options?: RequestInit) => Promise<void>;
export declare const getDeleteAdminNotificationMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAdminNotification>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof deleteAdminNotification>>, TError, {
    id: string;
}, TContext>;
export type DeleteAdminNotificationMutationResult = NonNullable<Awaited<ReturnType<typeof deleteAdminNotification>>>;
export type DeleteAdminNotificationMutationError = ErrorType<unknown>;
/**
* @summary Remove an announcement
*/
export declare const useDeleteAdminNotification: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof deleteAdminNotification>>, TError, {
        id: string;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof deleteAdminNotification>>, TError, {
    id: string;
}, TContext>;
export declare const getGetExecutiveDashboardUrl: () => string;
/**
 * @summary Get executive org-wide risk intelligence dashboard
 */
export declare const getExecutiveDashboard: (options?: RequestInit) => Promise<ExecutiveDashboard>;
export declare const getGetExecutiveDashboardQueryKey: () => readonly ["/api/executive/dashboard"];
export declare const getGetExecutiveDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getExecutiveDashboard>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getExecutiveDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getExecutiveDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetExecutiveDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getExecutiveDashboard>>>;
export type GetExecutiveDashboardQueryError = ErrorType<void>;
/**
 * @summary Get executive org-wide risk intelligence dashboard
 */
export declare function useGetExecutiveDashboard<TData = Awaited<ReturnType<typeof getExecutiveDashboard>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getExecutiveDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetHRDashboardUrl: () => string;
/**
 * @summary Get HR people-analytics dashboard
 */
export declare const getHRDashboard: (options?: RequestInit) => Promise<HRDashboard>;
export declare const getGetHRDashboardQueryKey: () => readonly ["/api/hr/dashboard"];
export declare const getGetHRDashboardQueryOptions: <TData = Awaited<ReturnType<typeof getHRDashboard>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getHRDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getHRDashboard>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetHRDashboardQueryResult = NonNullable<Awaited<ReturnType<typeof getHRDashboard>>>;
export type GetHRDashboardQueryError = ErrorType<void>;
/**
 * @summary Get HR people-analytics dashboard
 */
export declare function useGetHRDashboard<TData = Awaited<ReturnType<typeof getHRDashboard>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getHRDashboard>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getAiChatUrl: () => string;
/**
 * @summary Stream AI security intelligence response (SSE)
 */
export declare const aiChat: (aIChatRequest: AIChatRequest, options?: RequestInit) => Promise<string>;
export declare const getAiChatMutationOptions: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof aiChat>>, TError, {
        data: BodyType<AIChatRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationOptions<Awaited<ReturnType<typeof aiChat>>, TError, {
    data: BodyType<AIChatRequest>;
}, TContext>;
export type AiChatMutationResult = NonNullable<Awaited<ReturnType<typeof aiChat>>>;
export type AiChatMutationBody = BodyType<AIChatRequest>;
export type AiChatMutationError = ErrorType<unknown>;
/**
* @summary Stream AI security intelligence response (SSE)
*/
export declare const useAiChat: <TError = ErrorType<unknown>, TContext = unknown>(options?: {
    mutation?: UseMutationOptions<Awaited<ReturnType<typeof aiChat>>, TError, {
        data: BodyType<AIChatRequest>;
    }, TContext>;
    request?: SecondParameter<typeof customFetch>;
}) => UseMutationResult<Awaited<ReturnType<typeof aiChat>>, TError, {
    data: BodyType<AIChatRequest>;
}, TContext>;
export declare const getGetPredictiveOrgUrl: () => string;
/**
 * @summary Get org-level predictive risk indicators
 */
export declare const getPredictiveOrg: (options?: RequestInit) => Promise<PredictiveOrgResponse>;
export declare const getGetPredictiveOrgQueryKey: () => readonly ["/api/predictive/org"];
export declare const getGetPredictiveOrgQueryOptions: <TData = Awaited<ReturnType<typeof getPredictiveOrg>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPredictiveOrg>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPredictiveOrg>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPredictiveOrgQueryResult = NonNullable<Awaited<ReturnType<typeof getPredictiveOrg>>>;
export type GetPredictiveOrgQueryError = ErrorType<void>;
/**
 * @summary Get org-level predictive risk indicators
 */
export declare function useGetPredictiveOrg<TData = Awaited<ReturnType<typeof getPredictiveOrg>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPredictiveOrg>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetPredictiveEmployeeUrl: (id: number) => string;
/**
 * @summary Get employee-level predictive risk indicators
 */
export declare const getPredictiveEmployee: (id: number, options?: RequestInit) => Promise<PredictiveEmployeeResponse>;
export declare const getGetPredictiveEmployeeQueryKey: (id: number) => readonly [`/api/predictive/employee/${number}`];
export declare const getGetPredictiveEmployeeQueryOptions: <TData = Awaited<ReturnType<typeof getPredictiveEmployee>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPredictiveEmployee>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getPredictiveEmployee>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetPredictiveEmployeeQueryResult = NonNullable<Awaited<ReturnType<typeof getPredictiveEmployee>>>;
export type GetPredictiveEmployeeQueryError = ErrorType<void>;
/**
 * @summary Get employee-level predictive risk indicators
 */
export declare function useGetPredictiveEmployee<TData = Awaited<ReturnType<typeof getPredictiveEmployee>>, TError = ErrorType<void>>(id: number, options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getPredictiveEmployee>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export declare const getGetArabicPdfReportUrl: () => string;
/**
 * @summary Generate Arabic RTL PDF security intelligence report
 */
export declare const getArabicPdfReport: (options?: RequestInit) => Promise<string>;
export declare const getGetArabicPdfReportQueryKey: () => readonly ["/api/reports/arabic-pdf"];
export declare const getGetArabicPdfReportQueryOptions: <TData = Awaited<ReturnType<typeof getArabicPdfReport>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getArabicPdfReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}) => UseQueryOptions<Awaited<ReturnType<typeof getArabicPdfReport>>, TError, TData> & {
    queryKey: QueryKey;
};
export type GetArabicPdfReportQueryResult = NonNullable<Awaited<ReturnType<typeof getArabicPdfReport>>>;
export type GetArabicPdfReportQueryError = ErrorType<void>;
/**
 * @summary Generate Arabic RTL PDF security intelligence report
 */
export declare function useGetArabicPdfReport<TData = Awaited<ReturnType<typeof getArabicPdfReport>>, TError = ErrorType<void>>(options?: {
    query?: UseQueryOptions<Awaited<ReturnType<typeof getArabicPdfReport>>, TError, TData>;
    request?: SecondParameter<typeof customFetch>;
}): UseQueryResult<TData, TError> & {
    queryKey: QueryKey;
};
export {};
//# sourceMappingURL=api.d.ts.map