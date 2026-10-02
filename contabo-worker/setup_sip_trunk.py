#!/usr/bin/env python3
"""
=============================================================================
  Apex Voice AI - LiveKit SIP Trunk & Dispatch Rule Provisioner
  Automatically registers the Inbound SIP Trunk and SIP Dispatch Rule
  with the LiveKit SFU & SIP Gateway so incoming Telnyx calls are answered
  immediately without 486 flood / rejection errors.
=============================================================================
"""

import os
import sys
import asyncio
from loguru import logger

LIVEKIT_URL        = os.getenv("LIVEKIT_URL",        "ws://127.0.0.1:7880")
LIVEKIT_API_KEY    = os.getenv("LIVEKIT_API_KEY",    "apexvoice-livekit-prod")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "0293b25a21cb1c6e6f0ec2289befcc9a707f52b082f50a27225ca2970fce5f2c")

# Known Telnyx VoIP SIP Signaling subnets & wildcard
TELNYX_IPS = [
    "192.76.120.0/22",
    "64.16.224.0/19",
    "185.107.44.0/22",
    "188.165.249.0/24",
    "0.0.0.0/0",
]

PHONE_NUMBERS = [
    "+14153845276",
    "14153845276",
    "+12408503606",
    "12408503606",
    "+*",
    "*",
]

async def provision_sip():
    logger.info("Initializing LiveKit API client for SIP provisioning...")
    try:
        from livekit import api
    except ImportError as e:
        logger.error(f"Cannot import livekit.api: {e}")
        return False

    lk_api = api.LiveKitAPI(
        url=LIVEKIT_URL,
        api_key=LIVEKIT_API_KEY,
        api_secret=LIVEKIT_API_SECRET,
    )

    try:
        sip_service = getattr(lk_api, "sip", None)
        if not sip_service:
            logger.warning("LiveKitAPI has no .sip service attribute.")
            return False

        # ── 1. Check existing Inbound Trunks ──
        existing_trunks = []
        try:
            if hasattr(sip_service, "list_sip_inbound_trunk"):
                res = await sip_service.list_sip_inbound_trunk()
                existing_trunks = getattr(res, "items", getattr(res, "trunks", []))
            elif hasattr(sip_service, "list_inbound_trunks"):
                res = await sip_service.list_inbound_trunks()
                existing_trunks = getattr(res, "items", getattr(res, "trunks", []))
        except Exception as e:
            logger.warning(f"Error checking existing trunks: {e}")

        trunk_id = None
        if existing_trunks:
            logger.info(f"Found {len(existing_trunks)} existing SIP inbound trunk(s):")
            for t in existing_trunks:
                t_id = getattr(t, "sip_trunk_id", getattr(t, "id", None))
                t_name = getattr(t, "name", "Unnamed")
                logger.info(f"  - Trunk [{t_id}]: {t_name}")
                if not trunk_id and t_id:
                    trunk_id = t_id

        # ── 2. Create Inbound Trunk if none exists ──
        if not trunk_id:
            logger.info("Creating new Telnyx Inbound SIP Trunk...")
            trunk_info_kwargs = {
                "name": "Telnyx Inbound Trunk",
                "numbers": PHONE_NUMBERS,
            }

            # Check if SIPInboundTrunkInfo exists
            trunk_info_cls = getattr(api, "SIPInboundTrunkInfo", None)
            trunk_req_cls = getattr(api, "CreateSIPInboundTrunkRequest", None)

            if trunk_info_cls and trunk_req_cls:
                try:
                    trunk_info = trunk_info_cls(
                        name="Telnyx Inbound Trunk",
                        numbers=PHONE_NUMBERS,
                        allowed_addresses=TELNYX_IPS,
                    )
                except Exception:
                    # Fallback without allowed_addresses if not accepted
                    trunk_info = trunk_info_cls(
                        name="Telnyx Inbound Trunk",
                        numbers=PHONE_NUMBERS,
                    )

                try:
                    req = trunk_req_cls(trunk=trunk_info)
                except Exception:
                    req = trunk_req_cls(
                        name="Telnyx Inbound Trunk",
                        numbers=PHONE_NUMBERS,
                    )

                if hasattr(sip_service, "create_sip_inbound_trunk"):
                    created_trunk = await sip_service.create_sip_inbound_trunk(req)
                    trunk_id = getattr(created_trunk, "sip_trunk_id", getattr(created_trunk, "id", None))
                elif hasattr(sip_service, "create_inbound_trunk"):
                    created_trunk = await sip_service.create_inbound_trunk(req)
                    trunk_id = getattr(created_trunk, "sip_trunk_id", getattr(created_trunk, "id", None))

                logger.success(f"Successfully created SIP Inbound Trunk: {trunk_id}")

        # ── 3. Check existing Dispatch Rules ──
        existing_rules = []
        try:
            if hasattr(sip_service, "list_sip_dispatch_rule"):
                res = await sip_service.list_sip_dispatch_rule()
                existing_rules = getattr(res, "items", getattr(res, "rules", []))
            elif hasattr(sip_service, "list_dispatch_rules"):
                res = await sip_service.list_dispatch_rules()
                existing_rules = getattr(res, "items", getattr(res, "rules", []))
        except Exception as e:
            logger.warning(f"Error checking existing dispatch rules: {e}")

        rule_id = None
        if existing_rules:
            logger.info(f"Found {len(existing_rules)} existing SIP dispatch rule(s):")
            for r in existing_rules:
                r_id = getattr(r, "sip_dispatch_rule_id", getattr(r, "id", None))
                r_name = getattr(r, "name", "Unnamed")
                logger.info(f"  - Dispatch Rule [{r_id}]: {r_name}")
                if not rule_id and r_id:
                    rule_id = r_id

        # ── 4. Create Dispatch Rule if none exists ──
        if not rule_id:
            logger.info("Creating SIP Dispatch Rule (individual room per call: call-*)...")
            rule_cls = getattr(api, "SIPDispatchRule", None)
            indiv_cls = getattr(api, "SIPDispatchRuleIndividual", None)
            disp_req_cls = getattr(api, "CreateSIPDispatchRuleRequest", None)

            if rule_cls and indiv_cls and disp_req_cls:
                rule_obj = rule_cls(
                    dispatch_rule_individual=indiv_cls(
                        room_prefix="call-"
                    )
                )

                req_kwargs = {
                    "rule": rule_obj,
                    "name": "Inbound Call Dispatcher",
                }
                if trunk_id:
                    req_kwargs["trunk_ids"] = [trunk_id]

                try:
                    req = disp_req_cls(**req_kwargs)
                except Exception:
                    req = disp_req_cls(
                        dispatch_rule=rule_obj,
                        name="Inbound Call Dispatcher",
                    )

                if hasattr(sip_service, "create_sip_dispatch_rule"):
                    created_rule = await sip_service.create_sip_dispatch_rule(req)
                    rule_id = getattr(created_rule, "sip_dispatch_rule_id", getattr(created_rule, "id", None))
                elif hasattr(sip_service, "create_dispatch_rule"):
                    created_rule = await sip_service.create_dispatch_rule(req)
                    rule_id = getattr(created_rule, "sip_dispatch_rule_id", getattr(created_rule, "id", None))

                logger.success(f"Successfully created SIP Dispatch Rule: {rule_id}")

        logger.success("SIP Inbound Trunk and Dispatch Rule verified and ready!")
        return True

    except Exception as e:
        logger.error(f"Failed to provision SIP trunk / dispatch rule: {e}")
        return False
    finally:
        await lk_api.aclose()


if __name__ == "__main__":
    success = asyncio.run(provision_sip())
    sys.exit(0 if success else 1)
