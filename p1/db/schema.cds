namespace sap.im.precedent;

/**
 * CAP / HANA-oriented schema for P1 entities.
 * Local runtime uses file store mirroring these shapes.
 */

entity Incidents {
  key ID              : String(36);
      incidentNumber  : String(40);
      description     : LargeString;
      locationId      : String(40);
      equipmentId     : String(40);
      category        : String(80);
      status          : String(20); // OPEN | CLOSED
      closureReason   : String(40); // null | NOT_VALID | DUPLICATE | ...
      majorRootCause  : LargeString;
      correctiveAction: LargeString;
      closedAt        : Timestamp;
      updatedAt       : Timestamp;
      aiCategoryJson  : LargeString; // P2 FR1 side payload
}

entity IncidentEmbeddings {
  key incidentId   : String(36);
      embedding    : LargeString; // JSON vector until HANA Vector Engine
      modelVersion : String(40);
      indexedAt    : Timestamp;
      pool         : String(20); // CLOSED | FALSE_DUP
}

entity PrecedentResults {
  key incidentId         : String(36);
      status             : String(20); // READY | PENDING | UNAVAILABLE
      panelState         : String(10); // A | B | C | AB
      matchedIncidentId  : String(36);
      matchedIncidentNumber : String(40);
      matchConfidence    : Decimal(5, 4);
      summaryText        : LargeString;
      falseDupCount      : Integer;
      deepLinkJson       : LargeString;
      modelVersionsJson  : LargeString;
      computedAt         : Timestamp;
}

entity PrecedentConfig {
  key ID                        : String(10); // always 'default'
      featureEnabled            : Boolean;
      confidenceThreshold       : Decimal(5, 4);
      falseDupSimilarityThreshold : Decimal(5, 4);
      stateCMode                : String(20); // HIDE | LIGHTWEIGHT_NOTE
      filterLooseness           : String(20); // STRICT | MODERATE | LOOSE
      embeddingModelVersion     : String(40);
      deepLinkSemanticObject    : String(80);
      deepLinkAction            : String(40);
      deepLinkParamName         : String(40);
}

entity MatchFeedback {
  key feedbackId         : String(64);
      incidentId         : String(36);
      matchedIncidentId  : String(36);
      verdict            : String(20); // NOT_RELEVANT | HELPFUL | NOT_HELPFUL
      userId             : String(80);
      surface            : String(40);
      tuningUsed         : Boolean; // always false in v1 (AD-8)
      createdAt          : Timestamp;
}

entity AnalyticsEvents {
  key eventId            : String(64);
      type               : String(40);
      incidentId         : String(36);
      matchedIncidentId  : String(36);
      panelState         : String(10);
      surface            : String(40);
      userId             : String(80);
      metaJson           : LargeString;
      createdAt          : Timestamp;
}

entity AuditLog {
  key auditId            : String(64);
      action             : String(40);
      incidentId         : String(36);
      userId             : String(80);
      detailsJson        : LargeString;
      createdAt          : Timestamp;
}
