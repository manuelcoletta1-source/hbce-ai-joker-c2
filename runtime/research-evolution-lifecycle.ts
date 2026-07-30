/**
 * HERMETICUM B.C.E.
 * AI JOKER-C2
 *
 * Research Evolution Lifecycle
 *
 * Runtime pipeline:
 *
 * Mission
 *   ↓
 * BER
 *   ↓
 * EVT
 *   ↓
 * UNEBDO
 *   ↓
 * OPC
 *   ↓
 * VERIFIED BER
 */

import {
    BiocyberneticEvolutionRecord,
    assertValidBerRecord,
} from "../research/ber/biocybernetic-evolution-register";

export interface ResearchMission {

    id:string;

    title:string;

    completedAt:string;

    researchTrack:string;

}

export interface RuntimeServices{

    createEVT(record:BiocyberneticEvolutionRecord):Promise<string>;

    createUNEBDO(eventId:string):Promise<string>;

    createOPC(eventId:string,anchorId:string):Promise<string>;

    saveBER(record:BiocyberneticEvolutionRecord):Promise<void>;

}

export async function completeResearchMission(

    record:BiocyberneticEvolutionRecord,

    runtime:RuntimeServices

):Promise<BiocyberneticEvolutionRecord>{

    assertValidBerRecord(record);

    const eventId=await runtime.createEVT(record);

    const anchorId=await runtime.createUNEBDO(eventId);

    const opcId=await runtime.createOPC(

        eventId,

        anchorId

    );

    record.evidenceChain.eventId=eventId;

    record.evidenceChain.unebdoAnchorId=anchorId;

    record.evidenceChain.opcReceiptId=opcId;

    record.status="VERIFIED";

    await runtime.saveBER(record);

    return record;

}
