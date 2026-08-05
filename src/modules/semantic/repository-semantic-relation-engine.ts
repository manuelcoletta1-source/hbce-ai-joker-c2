/**
 * HERMETICUM B.C.E.
 *
 * AI JOKER-C2
 *
 * MOD-002
 * Repository Semantic Relation Engine
 *
 * Revision:
 * AIJC2-MOD002-SEMANTIC-RELATION-ENGINE-v1_0
 *
 * legalCertification=false
 */

import type {

    RepositorySemanticComponent,
    RepositorySemanticRelation,

} from "./repository-semantic-intelligence.types";

export const REPOSITORY_SEMANTIC_RELATION_ENGINE_REVISION =

    "AIJC2-MOD002-SEMANTIC-RELATION-ENGINE-v1_0" as const;

export function buildSemanticRelations(

    components:
        readonly RepositorySemanticComponent[],

): readonly RepositorySemanticRelation[] {

    const relations:
        RepositorySemanticRelation[] = [];

    for (const source of components) {

        for (const target of components) {

            if (

                source.componentId ===
                target.componentId

            ) {

                continue;

            }

            if (

                source.domain ===
                target.domain

            ) {

                relations.push({

                    relationId:

                        `REL-${relations.length + 1}`,

                    sourceComponentId:

                        source.componentId,

                    targetComponentId:

                        target.componentId,

                    relationType:

                        "USES",

                    evidenceIds:

                        [],

                    epistemicState:

                        "INFERENCE",

                    confidence:

                        60,

                });

            }

        }

    }

    return Object.freeze(

        relations,

    );

}
