import copy, json, tempfile, unittest
from pathlib import Path
from hbce_synthetic import emit, verify

class TestSynthetic(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root=Path(self.tmp.name)/'chain'
        emit(self.root)
    def test_valid_chain(self):
        self.assertEqual(verify(self.root),0)
    def test_tampered_payload(self):
        p=self.root/'HBCE-SYN-03.hbce.synthetic.json'
        obj=json.loads(p.read_text());obj['payload']['subject_id']='FORGED'
        p.write_text(json.dumps(obj))
        self.assertEqual(verify(self.root),1)
    def test_missing_certificate(self):
        (self.root/'HBCE-SYN-04.hbce.synthetic.json').unlink()
        self.assertEqual(verify(self.root),1)
    def test_production_flag(self):
        p=self.root/'HBCE-SYN-06.hbce.synthetic.json'
        obj=json.loads(p.read_text());obj['payload']['flags']['production_authorized']=True
        p.write_text(json.dumps(obj))
        self.assertEqual(verify(self.root),1)
    def test_reordered_link(self):
        p=self.root/'HBCE-SYN-05.hbce.synthetic.json'
        obj=json.loads(p.read_text());obj['payload']['previous_payload_sha256']='0'*64
        p.write_text(json.dumps(obj))
        self.assertEqual(verify(self.root),1)
    def test_fake_signature_claim(self):
        p=self.root/'HBCE-SYN-02.hbce.synthetic.json'
        obj=json.loads(p.read_text());obj['signature_status']='VERIFIED'
        p.write_text(json.dumps(obj))
        self.assertEqual(verify(self.root),1)

if __name__=='__main__': unittest.main()
