import {ContentStatus, type ContentTag, EmployeeRole, Prisma} from "../../server/generated/prisma/browser.ts";
import path from "node:path";
import fs, {readFile} from "node:fs/promises";
import {existsSync} from "node:fs";
import type {FileType} from "@shared/filetype.ts";
import {v4 as uuidv4} from "uuid";
import {getFileTypeFromFile} from "../../server/lib/filetype.ts";
import {bucketName, s3} from "../../server/s3.ts";
import {unzipSync} from "fflate";
import {auth0Management} from "../../server/auth.ts";

export const employeeData = [
    {
        id: "auth0|69d3f8c36ddd007770a559bb",
        role: EmployeeRole.BusinessAnalyst,
    },
    {
        id: "auth0|69d57c86bebf497028094f86",
        role: EmployeeRole.Admin,
    },
    {
        id: "auth0|69d57cb6f36c0b4100640abb",
        role: EmployeeRole.Underwriter,
    },
    {
        id: "auth0|69db05b92c0b718e1d54aaec",
        role: EmployeeRole.BusinessAnalyst,
    },
    {
        id: "auth0|69d57cd6e7bf39d172e848f0",
        role: EmployeeRole.Underwriter,
    },
    {
        id: "auth0|69d57cdf3f6e9b609fe8a916",
        role: EmployeeRole.BusinessAnalyst,
    },
    {
        id: "auth0|69d57cf83f6e9b609fe8a92f",
        role: EmployeeRole.Admin,
    },
    {
        id: "auth0|69d57d03e7bf39d172e84921",
        role: EmployeeRole.Underwriter,
    },
    {
        id: "auth0|69d57d0af36c0b4100640b0a",
        role: EmployeeRole.BusinessAnalyst,
    },
    {
        id: "auth0|69d57d78bebf497028095069",
        role: EmployeeRole.Admin,
    },
    {
        id: "auth0|69d57d91f36c0b4100640b99",
        role: EmployeeRole.Underwriter,
    },
    {
        id: "auth0|69d57d9d3f6e9b609fe8a9c4",
        role: EmployeeRole.BusinessAnalyst,
    },
    {
        id: "auth0|69d57daee7bf39d172e849b0",
        role: EmployeeRole.Underwriter,
    },
    {
        id: "auth0|69d57dc6e7bf39d172e849cb",
        role: EmployeeRole.BusinessAnalyst,
    },
]

export const tags: ContentTag[] = [
    // Document Type
    {
        name: "Workflow",
        category: "DocumentType",
    },
    {
        name: "Reference",
        category: "DocumentType",
    },
    {
        name: "Object",
        category: "ContentType",
    },
    {
        name: "Link",
        category: "ContentType",
    },
]

export const underwriterContent = [
    {
        title: "Risk Meter",
        description: "",
        url: "https://riskmeter.corelogic.com/",
        lastModifiedDate: new Date("2026-03-27"),
        expirationDate: new Date("2027-01-01"),
        status: ContentStatus.Complete,
    },
    {
        title: "Image Editor",
        description: "",
        url: "https://www.adobe.com/express/feature/image/editor",
        lastModifiedDate: new Date("2025-10-26"),
        expirationDate: new Date("2027-01-01"),
        status: ContentStatus.Complete,
    },
    {
        title: "Underwriter Workstation",
        description: "",
        url: "https://drive.google.com/drive/my-drive",
        lastModifiedDate: new Date("2025-07-13"),
        expirationDate: new Date("2026-06-15"),
        status: ContentStatus.Incomplete,
    },
    {
        title: "Document Signing",
        description: "",
        url: "https://www.docusign.com/",
        lastModifiedDate: new Date("2025-11-01"),
        expirationDate: new Date("2027-01-01"),
        status: ContentStatus.UnderReview,
    },
    {
        title: "Desktop Management Tool",
        description: "",
        url: "https://www.teamviewer.com/en-us/",
        lastModifiedDate: new Date("2025-09-15"),
        expirationDate: new Date("2026-12-31"),
        status: ContentStatus.Incomplete,
    },
    {
        title: "Process Automation Tool",
        description: "",
        url: "https://www.flowforma.com/",
        lastModifiedDate: new Date("2025-08-20"),
        expirationDate: new Date("2027-01-01"),
        status: ContentStatus.Complete,
    },
    {
        title: "Knowledge Base",
        description: "",
        url: "https://www.genre.com/us/knowledge?filters=article-type:publication,genre-languages:en&page=1&facet=all",
        lastModifiedDate: new Date("2025-10-05"),
        expirationDate: new Date("2026-10-01"),
        status: ContentStatus.UnderReview,
    },
    {
        title: "Image Processing System",
        description: "",
        url: "https://www.adobe.com/express/feature/image/editor",
        lastModifiedDate: new Date("2025-07-30"),
        expirationDate: new Date("2027-01-01"),
        status: ContentStatus.Incomplete,
    },
    {
        title: "Flood Information",
        description: "",
        url: "https://msc.fema.gov/portal/home",
        lastModifiedDate: new Date("2025-09-10"),
        expirationDate: new Date("2026-12-31"),
        status: ContentStatus.Complete,
    },
    {
        title: "OSHA Regulations",
        description: "",
        url: "https://www.osha.gov/laws-regs",
        lastModifiedDate: new Date("2025-11-20"),
        expirationDate: new Date("2027-01-01"),
        status: ContentStatus.UnderReview,
    },
    {
        title: "Pennsylvania Schedule Rating Plan",
        description: "",
        url: "https://pcrb.com/industry-reports/schedule-rating-plan/",
        lastModifiedDate: new Date("2025-08-05"),
        expirationDate: new Date("2026-10-01"),
        status: ContentStatus.Incomplete,
    },
];
export const businessAnalystContent = [
    {
        title: "Kentucky Tax Law",
        description: "",
        url: "https://revenue.ky.gov/Get-Help/pages/research-tax-laws.aspx",
        lastModifiedDate: new Date("2026-02-04"),
        expirationDate: new Date("2026-04-15"),
        status: ContentStatus.UnderReview,
    },
    {
        title: "Oregon Tax Law",
        description: "",
        url: "https://www.oregon.gov/dor/pages/rules-laws.aspx",
        lastModifiedDate: new Date("2025-12-12"),
        expirationDate: new Date("2026-04-15"),
        status: ContentStatus.Complete,
    },
    {
        title: "States on Hold",
        description: "",
        url: "https://www.policygenius.com/homeowners-insurance/home-insurance-availability-guide-states-crisis/",
        lastModifiedDate: new Date("2025-11-15"),
        expirationDate: new Date("2026-12-31"),
        status: ContentStatus.UnderReview,
    },
    {
        title: "Error Lookup Tool",
        description: "",
        url: "https://www.google.com/",
        lastModifiedDate: new Date("2025-10-01"),
        expirationDate: new Date("2027-01-01"),
        status: ContentStatus.Incomplete,
    },
    {
        title: "Workflow Management Platform",
        description: "",
        url: "https://monday.com/",
        lastModifiedDate: new Date("2025-09-20"),
        expirationDate: new Date("2027-01-01"),
        status: ContentStatus.Complete,
    },
    {
        title: "Claim Search",
        description: "",
        url: "https://claimsearch.iso.com/index.asp",
        lastModifiedDate: new Date("2025-08-10"),
        expirationDate: new Date("2026-12-31"),
    },
    {
        title: "Business Analyst Guide",
        description: "",
        url: "https://www.iiba.org/career-resources/a-business-analysis-professionals-foundation-for-success/babok/",
        lastModifiedDate: new Date("2025-07-01"),
        expirationDate: new Date("2027-01-01"),
    },
    {
        title: "State Research Guides",
        description: "",
        url: "https://www.namic.org/compliance/50-state-research-guides/",
        lastModifiedDate: new Date("2025-11-05"),
        expirationDate: new Date("2026-10-01"),
    },
    {
        title: "Policy Tracking Software",
        description: "",
        url: "https://www.agencybloc.com/",
        lastModifiedDate: new Date("2025-10-15"),
        expirationDate: new Date("2027-01-01"),
    },
    {
        title: "Latest Insurance News",
        description: "",
        url: "https://www.insurancejournal.com/",
        lastModifiedDate: new Date("2025-09-05"),
        expirationDate: new Date("2026-12-31"),
    },
];