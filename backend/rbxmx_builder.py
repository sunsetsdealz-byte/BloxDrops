"""Builds a Roblox Accessory .rbxmx XML file for a BloxDrops drop.

This is the standard format Roblox Studio reads when you drag a .rbxmx into
Explorer. We pre-configure:
  - AccessoryType (Hat/Hair/Back/etc) based on the drop's attachment_type
  - A child MeshPart named "Handle" with the right physics flags
  - A child Attachment named for the chosen accessory slot
  - The MeshPart's MeshId pointed at rbxassetid://{model_asset_id}

User workflow once they drag this file into Studio:
  1. Explorer shows a fully-configured Accessory
  2. Select the Accessory → right-click → "Save to Roblox" → Submit
     as an Avatar Item to the Marketplace

The only thing the user MAY need to adjust is the MeshId (if Roblox's auto
mesh extraction doesn't pick up the GLB's internal mesh). The Asset ID is
provided so they can paste it directly into MeshPart > MeshId.
"""
from typing import Dict


# Roblox Enum.AccessoryType values
ACCESSORY_TYPE = {
    "Hat": 1,
    "Hair": 2,
    "Face": 3,
    "Neck": 4,
    "Shoulder": 5,
    "Front": 6,
    "Back": 7,
    "Waist": 8,
    # Legacy "layered clothing" types
    "TShirt": 9,
    "Shirt": 10,
    "Pants": 11,
    "Jacket": 12,
    "Sweater": 13,
    "Shorts": 14,
    "LeftShoe": 15,
    "RightShoe": 16,
    "DressSkirt": 17,
    "Eyebrow": 18,
    "Eyelash": 19,
}

# Map of BloxDrops attachment_type → (accessory_type_int, attachment_point_name)
ATTACHMENT_MAP: Dict[str, tuple] = {
    "Hat": (ACCESSORY_TYPE["Hat"], "HatAttachment"),
    "Hair": (ACCESSORY_TYPE["Hair"], "HairAttachment"),
    "Face": (ACCESSORY_TYPE["Face"], "FaceFrontAttachment"),
    "Neck": (ACCESSORY_TYPE["Neck"], "NeckAttachment"),
    "Shoulder": (ACCESSORY_TYPE["Shoulder"], "LeftShoulderAttachment"),
    "Back": (ACCESSORY_TYPE["Back"], "BodyBackAttachment"),
    "Hoodie": (ACCESSORY_TYPE["Sweater"], "BodyFrontAttachment"),
    "Shirt": (ACCESSORY_TYPE["Shirt"], "BodyFrontAttachment"),
    "Jacket": (ACCESSORY_TYPE["Jacket"], "BodyFrontAttachment"),
    "auto": (ACCESSORY_TYPE["Hat"], "HatAttachment"),
}


def _xml_escape(s: str) -> str:
    return (
        s.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def build_accessory_rbxmx(
    asset_id: str,
    asset_name: str,
    attachment_type: str,
    description: str = "",
) -> str:
    """Return an .rbxmx XML string for a fully-wrapped Accessory."""
    accessory_type_int, attachment_point = ATTACHMENT_MAP.get(
        attachment_type, ATTACHMENT_MAP["Hat"]
    )
    safe_name = _xml_escape((asset_name or "BloxDrops Accessory")[:60])
    safe_desc = _xml_escape((description or "Generated with BloxDrops AI")[:280])
    mesh_url = f"rbxassetid://{asset_id}" if asset_id else ""

    return f"""<?xml version="1.0" encoding="utf-8"?>
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <External>null</External>
  <External>nil</External>
  <Item class="Accessory" referent="RBX_ACC_0">
    <Properties>
      <string name="Name">{safe_name}</string>
      <token name="AccessoryType">{accessory_type_int}</token>
      <CoordinateFrame name="AttachmentPoint">
        <X>0</X><Y>0</Y><Z>0</Z>
        <R00>1</R00><R01>0</R01><R02>0</R02>
        <R10>0</R10><R11>1</R11><R12>0</R12>
        <R20>0</R20><R21>0</R21><R22>1</R22>
      </CoordinateFrame>
      <string name="Description">{safe_desc}</string>
    </Properties>
    <Item class="MeshPart" referent="RBX_MESH_0">
      <Properties>
        <string name="Name">Handle</string>
        <Content name="MeshId"><url>{mesh_url}</url></Content>
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
          <string name="Name">{attachment_point}</string>
          <CoordinateFrame name="CFrame">
            <X>0</X><Y>0</Y><Z>0</Z>
            <R00>1</R00><R01>0</R01><R02>0</R02>
            <R10>0</R10><R11>1</R11><R12>0</R12>
            <R20>0</R20><R21>0</R21><R22>1</R22>
          </CoordinateFrame>
        </Properties>
      </Item>
      <Item class="SpecialMesh" referent="RBX_SM_0">
        <Properties>
          <Content name="MeshId"><url>{mesh_url}</url></Content>
          <token name="MeshType">5</token>
          <Vector3 name="Scale"><X>1</X><Y>1</Y><Z>1</Z></Vector3>
        </Properties>
      </Item>
    </Item>
  </Item>
</roblox>
"""
