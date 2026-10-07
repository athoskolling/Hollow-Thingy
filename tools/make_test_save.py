"""Builds a synthetic Hollow Knight PC save (user#.dat format) for testing the importer.
Format: C# BinaryFormatter header + 7-bit length + Base64(AES-256-ECB(PKCS7(JSON))) + 0x0B."""
import json, base64, sys
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding
KEY=b'UKu52ePUBwetZ9wNX88o54dnfKRu0T1l'
HEADER=bytes([0,1,0,0,0,255,255,255,255,1,0,0,0,0,0,0,0,6,1,0,0,0])
def encode(obj):
    raw=json.dumps(obj).encode()
    p=padding.PKCS7(128).padder(); data=p.update(raw)+p.finalize()
    enc=Cipher(algorithms.AES(KEY),modes.ECB()).encryptor(); ct=enc.update(data)+enc.finalize()
    b64=base64.b64encode(ct); n=len(b64); pre=bytearray()
    while True:
        b=n&0x7f; n>>=7
        if n: pre.append(b|0x80)
        else: pre.append(b); break
    return HEADER+bytes(pre)+b64+bytes([11])
pd={"version":"1.5.78.11833","geo":1437,"dreamOrbs":1437,"grubsCollected":12,"completionPercentage":58,"playTime":123456.0,
 "hasDash":True,"hasWalljump":True,"hasSuperDash":True,"hasDoubleJump":True,"hasAcidArmour":False,"hasShadowDash":False,"hasKingsBrand":False,
 "fireballLevel":1,"quakeLevel":2,"screamLevel":0,"hasDreamNail":True,"dreamNailUpgraded":False,"mothDeparted":False,"nailSmithUpgrades":3,
 "hasDashSlash":True,"hasUpwardSlash":False,"hasCyclone":False,"hegemolDefeated":True,"lurienDefeated":False,"monomonDefeated":False,
 "falseKnightDefeated":True,"hornet1Defeated":True,"mageLordDefeated":True,"defeatedDungDefender":True,"killedInfectedKnight":True,
 "slyShellFrag1":True,"slyShellFrag2":True,"slyShellFrag3":False,"slyShellFrag4":False,"dreamReward7":False,"dreamReward5":True,"dreamReward3":True,
 "slyVesselFrag1":True,"slyVesselFrag2":False,"vesselFragStagNest":False,"maxHealthBase":6,"heartPieces":1,"MPReserveMax":33,"vesselFragments":1,
 "grimmChildLevel":2,"gotCharm_40":True,"killedGrimm":False,"nightmareLanternLit":True,"killedHollowKnight":False,"gotShadeCharm":False,
 "hasSlykey":False,"gaveSlykey":True,"hasWhiteKey":False,"usedWhiteKey":False,"charmSlots":5,"ore":1,"simpleKeys":1,
 "bossDoorStateTier1":{"completed":False},"colosseumBronzeCompleted":False,"aladarSlugDefeated":2,"xeroDefeated":0}
for i in range(1,41): pd.setdefault("gotCharm_%d"%i, i in (1,2,3,4,6,12,20,21,30,31,33,34,40))
scene={"persistentBoolItems":[{"id":"Heart Piece","sceneName":"Crossroads_13","activated":True,"semiPersistent":False},
 {"id":"Heart Piece","sceneName":"Room_Bretta","activated":True,"semiPersistent":False},
 {"id":"Vessel Fragment","sceneName":"Fungus1_13","activated":True,"semiPersistent":False},
 {"id":"Battle Scene","sceneName":"Crossroads_04","activated":True,"semiPersistent":False},
 {"id":"Battle Scene Ore","sceneName":"Abyss_17","activated":True,"semiPersistent":False}]}
out=sys.argv[1] if len(sys.argv)>1 else 'tests/fixtures/user-test.dat'
open(out,'wb').write(encode({"playerData":pd,"sceneData":scene}))
print('wrote',out)
