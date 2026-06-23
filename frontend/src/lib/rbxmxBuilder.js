/**
 * Client-side .rbxmx builder - generates Roblox Accessory XML without backend
 */

const ACCESSORY_TYPE = {
  Hat: 1,
  Hair: 2,
  Face: 3,
  Neck: 4,
  Shoulder: 5,
  Back: 7,
  Hoodie: 13,
  Shirt: 10,
  Jacket: 12,
};

const ATTACHMENT_MAP = {
  Hat: [ACCESSORY_TYPE.Hat, 'HatAttachment'],
  Hair: [ACCESSORY_TYPE.Hair, 'HairAttachment'],
  Face: [ACCESSORY_TYPE.Face, 'FaceFrontAttachment'],
  Neck: [ACCESSORY_TYPE.Neck, 'NeckAttachment'],
  Shoulder: [ACCESSORY_TYPE.Shoulder, 'LeftShoulderAttachment'],
  Back: [ACCESSORY_TYPE.Back, 'BodyBackAttachment'],
  Hoodie: [ACCESSORY_TYPE.Hoodie, 'BodyFrontAttachment'],
  Shirt: [ACCESSORY_TYPE.Shirt, 'BodyFrontAttachment'],
  Jacket: [ACCESSORY_TYPE.Jacket, 'BodyFrontAttachment'],
};

function xmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildAccessoryRbxmx({ assetId, name, attachmentType, description = '' }) {
  const [typeInt, attachmentPoint] = ATTACHMENT_MAP[attachmentType] || ATTACHMENT_MAP.Hat;
  const safeName = xmlEscape((name || 'BloxDrops Accessory').slice(0, 60));
  const safeDesc = xmlEscape((description || 'Generated with BloxDrops AI').slice(0, 280));

  return `<?xml version="1.0" encoding="utf-8"?>
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <External>null</External>
  <External>nil</External>
  <Item class="Accessory" referent="RBX_ACC_0">
    <Properties>
      <string name="Name">${safeName}</string>
      <token name="AccessoryType">${typeInt}</token>
      <CoordinateFrame name="AttachmentPoint">
        <X>0</X><Y>0</Y><Z>0</Z>
        <R00>1</R00><R01>0</R01><R02>0</R02>
        <R10>0</R10><R11>1</R11><R12>0</R12>
        <R20>0</R20><R21>0</R21><R22>1</R22>
      </CoordinateFrame>
      <string name="Description">${safeDesc}</string>
    </Properties>
    <Item class="MeshPart" referent="RBX_MESH_0">
      <Properties>
        <string name="Name">Handle</string>
        <Content name="MeshId"><url>rbxassetid://${assetId}</url></Content>
        <bool name="CanCollide">false</bool>
        <bool name="CanQuery">false</bool>
        <bool name="CanTouch">false</bool>
        <bool name="Massless">true</bool>
        <token name="CollisionFidelity">2</token>
        <token name="RenderFidelity">0</token>
        <Vector3 name="size"><X>1</X><Y>1</Y><Z>1</Z></Vector3>
        <CoordinateFrame name="CFrame">
          <X>0</X><Y>5</Y><Z>0</Z>
          <R00>1</R00><R01>0</R01><R02>0</R02>
          <R10>0</R10><R11>1</R11><R12>0</R12>
          <R20>0</R20><R21>0</R21><R22>1</R22>
        </CoordinateFrame>
      </Properties>
      <Item class="Attachment" referent="RBX_ATT_0">
        <Properties>
          <string name="Name">${attachmentPoint}</string>
          <CoordinateFrame name="CFrame">
            <X>0</X><Y>0</Y><Z>0</Z>
            <R00>1</R00><R01>0</R01><R02>0</R02>
            <R10>0</R10><R11>1</R11><R12>0</R12>
            <R20>0</R20><R21>0</R21><R22>1</R22>
          </CoordinateFrame>
        </Properties>
      </Item>
    </Item>
  </Item>
</roblox>`;
}

export function downloadRbxmx({ assetId, name, attachmentType, description }) {
  const xml = buildAccessoryRbxmx({ assetId, name, attachmentType, description });
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(name || 'accessory').replace(/[^a-z0-9]/gi, '_')}.rbxmx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
