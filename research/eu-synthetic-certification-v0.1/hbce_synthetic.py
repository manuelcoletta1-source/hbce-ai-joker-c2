#!/usr/bin/env python3
"""HBCE synthetic certificate chain. Stdlib only; no production trust or legal status."""
import argparse, hashlib, json, pathlib, sys
from datetime import datetime, timedelta, timezone

PROTOCOL = 'HBCE-EU-SYNTHETIC-v0.1'
STAGES = [
 ('HBCE-SYN-01','SYNTHETIC_BIOLOGICAL_IDENTITY'),
 ('HBCE-SYN-02','SYNTHETIC_EU_ENTERPRISE'),
 ('HBCE-SYN-03','SYNTHETIC_REPRESENTATION'),
 ('HBCE-SYN-04','SYNTHETIC_IPR_CONTINUITY'),
 ('HBCE-SYN-05','SYNTHETIC_MISSION_MANDATE'),
 ('HBCE-SYN-06','SYNTHETIC_JOKER_ACCESS_EVALUATION'),
 ('HBCE-SYN-07','SYNTHETIC_EVIDENCE_LEDGER'),
 ('HBCE-SYN-08','SIMULATION_LIMITS_DECLARATION'),
]
FLAGS = {'synthetic_only':True,'legal_validity':'NONE','production_authorized':False,'qualified_eidas':False,'g0':'HOLD','wp01':'HOLD','release':'NOT_GRANTED'}

def canonical(obj):
    return json.dumps(obj, sort_keys=True, separators=(',', ':'), ensure_ascii=False).encode('utf-8')

def digest(obj):
    return hashlib.sha256(canonical(obj)).hexdigest()

def emit(directory):
    directory.mkdir(parents=True, exist_ok=False)
    now = datetime.now(timezone.utc).replace(microsecond=0)
    # Deliberately fake identifiers; not real VAT numbers or identity claims.
    subject='SYNTHETIC-SUBJECT-0001'
    enterprise='SYNTHETIC-EU-ENTERPRISE-0001'
    previous=None
    for i,(code,kind) in enumerate(STAGES,1):
        payload={'protocol':PROTOCOL,'issuer':'HERMETICUM B.C.E. S.r.l. - SYNTHETIC TEST ISSUER',
            'certificate_id':f'{code}-DEMO-0001','kind':kind,'phase':i,
            'subject_id':subject,'enterprise_id':enterprise,
            'vat_id':'TEST-ONLY-NOT-A-VAT-NUMBER',
            'issued_at':now.isoformat(),'expires_at':(now+timedelta(days=30)).isoformat(),
            'previous_payload_sha256':previous,'status':'SYNTHETIC_TEST',
            'trust_domain':'ISOLATED_SYNTHETIC_DEMO','flags':FLAGS}
        certificate={'payload':payload,'payload_sha256':digest(payload),
            'signature':None,'signature_status':'UNSIGNED_TEST_ONLY'}
        (directory/f'{code}.hbce.synthetic.json').write_bytes(canonical(certificate)+b'\n')
        previous=certificate['payload_sha256']
    (directory/'manifest.json').write_bytes(canonical({'protocol':PROTOCOL,'count':len(STAGES),
        'last_payload_sha256':previous,'synthetic_only':True,'release':'NOT_GRANTED'})+b'\n')
    print('EMITTED_SYNTHETIC_CERTIFICATES=8')
    print('CRYPTOGRAPHIC_SIGNATURES=NONE')
    print('LEGAL_VALIDITY=NONE')
    print('PRODUCTION_AUTHORIZED=NO')

def verify(directory):
    errors=[]; previous=None
    for i,(code,kind) in enumerate(STAGES,1):
        path=directory/f'{code}.hbce.synthetic.json'
        try:
            c=json.loads(path.read_text(encoding='utf-8'))
            p=c['payload']
            if set(c)!={'payload','payload_sha256','signature','signature_status'}: errors.append(f'{code}: unexpected certificate structure')
            if c['payload_sha256']!=digest(p): errors.append(f'{code}: payload hash mismatch')
            if p.get('previous_payload_sha256')!=previous: errors.append(f'{code}: broken chain')
            if p.get('protocol')!=PROTOCOL or p.get('kind')!=kind or p.get('phase')!=i: errors.append(f'{code}: wrong protocol/kind/phase')
            if p.get('flags')!=FLAGS or p.get('status')!='SYNTHETIC_TEST': errors.append(f'{code}: invalid flags/status')
            if p.get('trust_domain')!='ISOLATED_SYNTHETIC_DEMO': errors.append(f'{code}: invalid trust domain')
            if c.get('signature') is not None or c.get('signature_status')!='UNSIGNED_TEST_ONLY': errors.append(f'{code}: unexpected signature assertion')
            if p.get('vat_id')!='TEST-ONLY-NOT-A-VAT-NUMBER': errors.append(f'{code}: non-synthetic VAT marker')
            previous=c['payload_sha256']
        except (OSError, ValueError, KeyError, TypeError) as exc:
            errors.append(f'{code}: invalid or missing file ({type(exc).__name__})')
    try:
        m=json.loads((directory/'manifest.json').read_text(encoding='utf-8'))
        if m!={'protocol':PROTOCOL,'count':8,'last_payload_sha256':previous,'synthetic_only':True,'release':'NOT_GRANTED'}: errors.append('manifest mismatch')
    except (OSError, ValueError, TypeError): errors.append('invalid manifest')
    if errors:
        for e in errors: print('FAIL='+e)
        print('RESULT=FAIL_CLOSED')
        return 1
    print('CHAIN_HASH_CHECK=PASS')
    print('SYNTHETIC_POLICY_CHECK=PASS')
    print('SIGNATURE_VERIFICATION=NOT_IMPLEMENTED')
    print('ISSUER_AUTHENTICITY=NOT_VERIFIED')
    print('REVOCATION_VERIFICATION=NOT_IMPLEMENTED')
    print('LEGAL_VALIDITY=NONE')
    print('PRODUCTION_AUTHORIZED=NO')
    print('RESULT=STRUCTURAL_PASS_ONLY')
    return 0

if __name__=='__main__':
    ap=argparse.ArgumentParser()
    ap.add_argument('command',choices=['emit','verify'])
    ap.add_argument('directory',type=pathlib.Path)
    args=ap.parse_args()
    if args.command=='emit':
        if args.directory.exists(): sys.exit('FAIL_CLOSED_OUTPUT_EXISTS')
        emit(args.directory)
    else: sys.exit(verify(args.directory))
