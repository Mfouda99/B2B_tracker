from rest_framework.decorators import api_view
from rest_framework.response import Response
from collections import Counter, defaultdict
from .sheets import sheet_to_dicts


# ── raw data endpoints ──────────────────────────────────────────────────────

@api_view(['GET'])
def igv_submissions(request):
    return Response(sheet_to_dicts('IGV Submissions'))


@api_view(['GET'])
def igte_submissions(request):
    return Response(sheet_to_dicts('IGTa/e Submissions'))


@api_view(['GET'])
def igv_contracts(request):
    return Response(sheet_to_dicts('IGV Contracts System'))


@api_view(['GET'])
def igte_contracts(request):
    return Response(sheet_to_dicts('IGTa/e Contracts System'))


# ── analytics endpoints ─────────────────────────────────────────────────────

def _safe_int(val):
    try:
        v = str(val).replace('-', '0').strip()
        return int(v) if v not in ('', 'N/A') else 0
    except (ValueError, TypeError):
        return 0


@api_view(['GET'])
def dashboard_stats(request):
    igv_subs = sheet_to_dicts('IGV Submissions')
    igte_subs = sheet_to_dicts('IGTa/e Submissions')
    igv_cons = sheet_to_dicts('IGV Contracts System')
    igte_cons = sheet_to_dicts('IGTa/e Contracts System')

    def submission_stats(rows, opens_key, apds_key, res_key, ecb_key=None):
        total_opens = sum(_safe_int(r.get(opens_key, 0)) for r in rows)
        total_apds = sum(_safe_int(r.get(apds_key, 0)) for r in rows)
        total_res = sum(_safe_int(r.get(res_key, 0)) for r in rows)
        ecb_opens = sum(_safe_int(r.get(ecb_key, 0)) for r in rows) if ecb_key else 0
        statuses = Counter(r.get('Status (Expa)', '').strip() for r in rows)
        return {
            'total_submissions': len(rows),
            'total_opens': total_opens,
            'total_apds': total_apds,
            'total_res': total_res,
            'ecb_opens': ecb_opens,
            'status_breakdown': dict(statuses),
        }

    igv_stats = submission_stats(igv_subs, 'Total  Opens', 'APDs', 'REs', 'Total  Opens by ECB')
    igte_stats = submission_stats(igte_subs, 'Total Opens', 'APDs', 'REs', 'Opens By ECB')

    return Response({
        'igv': {**igv_stats, 'total_contracts': len(igv_cons)},
        'igte': {**igte_stats, 'total_contracts': len(igte_cons)},
        'combined': {
            'total_submissions': igv_stats['total_submissions'] + igte_stats['total_submissions'],
            'total_opens': igv_stats['total_opens'] + igte_stats['total_opens'],
            'total_apds': igv_stats['total_apds'] + igte_stats['total_apds'],
            'total_res': igv_stats['total_res'] + igte_stats['total_res'],
            'total_contracts': len(igv_cons) + len(igte_cons),
        }
    })


@api_view(['GET'])
def lc_performance(request):
    igv_subs = sheet_to_dicts('IGV Submissions')
    igte_subs = sheet_to_dicts('IGTa/e Submissions')

    lc_data = defaultdict(lambda: {
        'igv_submissions': 0, 'igv_opens': 0, 'igv_apds': 0, 'igv_res': 0,
        'igte_submissions': 0, 'igte_opens': 0, 'igte_apds': 0, 'igte_res': 0,
    })

    for r in igv_subs:
        lc = r.get('AIESEC Local Chapter Name', 'Unknown').strip() or 'Unknown'
        lc_data[lc]['igv_submissions'] += 1
        lc_data[lc]['igv_opens'] += _safe_int(r.get('Total  Opens', 0))
        lc_data[lc]['igv_apds'] += _safe_int(r.get('APDs', 0))
        lc_data[lc]['igv_res'] += _safe_int(r.get('REs', 0))

    for r in igte_subs:
        lc = r.get('AIESEC Local Chapter Name', 'Unknown').strip() or 'Unknown'
        lc_data[lc]['igte_submissions'] += 1
        lc_data[lc]['igte_opens'] += _safe_int(r.get('Total Opens', 0))
        lc_data[lc]['igte_apds'] += _safe_int(r.get('APDs', 0))
        lc_data[lc]['igte_res'] += _safe_int(r.get('REs', 0))

    result = []
    for lc, d in lc_data.items():
        result.append({
            'lc': lc,
            **d,
            'total_submissions': d['igv_submissions'] + d['igte_submissions'],
            'total_res': d['igv_res'] + d['igte_res'],
            'total_apds': d['igv_apds'] + d['igte_apds'],
        })

    result.sort(key=lambda x: x['total_res'], reverse=True)
    return Response(result)


@api_view(['GET'])
def submission_status_breakdown(request):
    igv_subs = sheet_to_dicts('IGV Submissions')
    igte_subs = sheet_to_dicts('IGTa/e Submissions')

    igv_statuses = Counter(r.get('Status (Expa)', '----').strip() or '----' for r in igv_subs)
    igte_statuses = Counter(r.get('Status (Expa)', '----').strip() or '----' for r in igte_subs)

    return Response({
        'igv': [{'status': k, 'count': v} for k, v in igv_statuses.most_common()],
        'igte': [{'status': k, 'count': v} for k, v in igte_statuses.most_common()],
    })


@api_view(['GET'])
def contracts_by_lc(request):
    igv_cons = sheet_to_dicts('IGV Contracts System')
    igte_cons = sheet_to_dicts('IGTa/e Contracts System')

    igv_lc = Counter(r.get('LC Name', 'Unknown').strip() for r in igv_cons if r.get('LC Name', '').strip())
    igte_lc = Counter(r.get('LC Name', 'Unknown').strip() for r in igte_cons if r.get('LC Name', '').strip())

    return Response({
        'igv': [{'lc': k, 'count': v} for k, v in igv_lc.most_common(20)],
        'igte': [{'lc': k, 'count': v} for k, v in igte_lc.most_common(20)],
    })


@api_view(['GET'])
def contract_types(request):
    igv_cons = sheet_to_dicts('IGV Contracts System')
    igte_cons = sheet_to_dicts('IGTa/e Contracts System')

    igv_types = Counter(r.get('Contract Type', 'Unknown').strip() for r in igv_cons if r.get('Contract Type', '').strip())
    igte_types = Counter(r.get('Contract Type', 'Unknown').strip() for r in igte_cons if r.get('Contract Type', '').strip())

    return Response({
        'igv': [{'type': k, 'count': v} for k, v in igv_types.most_common()],
        'igte': [{'type': k, 'count': v} for k, v in igte_types.most_common()],
    })


@api_view(['GET'])
def industry_breakdown(request):
    igte_cons = sheet_to_dicts('IGTa/e Contracts System')
    igv_cons = sheet_to_dicts('IGV Contracts System')

    igte_industries = Counter(r.get('Industry', '').strip() for r in igte_cons if r.get('Industry', '').strip())
    igv_fields = Counter(r.get('Field(s) of Work', '').strip() for r in igv_cons if r.get('Field(s) of Work', '').strip())

    return Response({
        'igte_industries': [{'name': k, 'count': v} for k, v in igte_industries.most_common(15)],
        'igv_fields': [{'name': k, 'count': v} for k, v in igv_fields.most_common(15)],
    })


@api_view(['GET'])
def monthly_contracts(request):
    igv_cons = sheet_to_dicts('IGV Contracts System')
    igte_cons = sheet_to_dicts('IGTa/e Contracts System')

    def parse_month(date_str):
        if not date_str:
            return None
        parts = date_str.strip().split('/')
        if len(parts) >= 3:
            try:
                month = int(parts[0])
                year = int(parts[2])
                return f"{year}-{month:02d}"
            except (ValueError, IndexError):
                return None
        return None

    igv_months = Counter()
    for r in igv_cons:
        m = parse_month(r.get('Timestamp', ''))
        if m:
            igv_months[m] += 1

    igte_months = Counter()
    for r in igte_cons:
        m = parse_month(r.get('Timestamp', ''))
        if m:
            igte_months[m] += 1

    all_months = sorted(set(igv_months) | set(igte_months))
    return Response([
        {'month': m, 'igv': igv_months.get(m, 0), 'igte': igte_months.get(m, 0)}
        for m in all_months
    ])


@api_view(['GET'])
def org_size_breakdown(request):
    igv_cons = sheet_to_dicts('IGV Contracts System')
    igte_cons = sheet_to_dicts('IGTa/e Contracts System')

    igv_sizes = Counter(r.get('Organization Size (number of employees)', '').strip() for r in igv_cons if r.get('Organization Size (number of employees)', '').strip())
    igte_sizes = Counter(r.get('Organization Size (number of employees)', '').strip() for r in igte_cons if r.get('Organization Size (number of employees)', '').strip())

    return Response({
        'igv': [{'size': k, 'count': v} for k, v in igv_sizes.most_common()],
        'igte': [{'size': k, 'count': v} for k, v in igte_sizes.most_common()],
    })


@api_view(['GET'])
def top_lcs_by_res(request):
    igv_subs = sheet_to_dicts('IGV Submissions')
    igte_subs = sheet_to_dicts('IGTa/e Submissions')

    lc_res = defaultdict(int)
    for r in igv_subs:
        lc = r.get('AIESEC Local Chapter Name', '').strip()
        if lc:
            lc_res[lc] += _safe_int(r.get('REs', 0))
    for r in igte_subs:
        lc = r.get('AIESEC Local Chapter Name', '').strip()
        if lc:
            lc_res[lc] += _safe_int(r.get('REs', 0))

    top = sorted(lc_res.items(), key=lambda x: x[1], reverse=True)[:15]
    return Response([{'lc': lc, 'res': res} for lc, res in top])


COUNTED_STATUSES = {'open', 'un_publish', 'expired'}


@api_view(['GET'])
def fulfillment_rate(request):
    igv_subs = sheet_to_dicts('IGV Submissions')
    igte_subs = sheet_to_dicts('IGTa/e Submissions')

    # Only include submissions whose status is open, un_publish, or expired
    igv_filtered = [
        r for r in igv_subs
        if r.get('Status (Expa)', '').strip().lower() in COUNTED_STATUSES
    ]
    igte_filtered = [
        r for r in igte_subs
        if r.get('Status (Expa)', '').strip().lower() in COUNTED_STATUSES
    ]

    # Slots = "Total Opens by ECB" per submission (how many slots were opened)
    igv_slots = defaultdict(int)
    for r in igv_filtered:
        lc = r.get('AIESEC Local Chapter Name', '').strip()
        if lc:
            igv_slots[lc] += _safe_int(r.get('Total  Opens by ECB', 0))

    igte_slots = defaultdict(int)
    for r in igte_filtered:
        lc = r.get('AIESEC Local Chapter Name', '').strip()
        if lc:
            igte_slots[lc] += _safe_int(r.get('Opens By ECB', 0))

    # APDs per LC — filtered to same statuses
    igv_apds = defaultdict(int)
    for r in igv_filtered:
        lc = r.get('AIESEC Local Chapter Name', '').strip()
        if lc:
            igv_apds[lc] += _safe_int(r.get('APDs', 0))

    igte_apds = defaultdict(int)
    for r in igte_filtered:
        lc = r.get('AIESEC Local Chapter Name', '').strip()
        if lc:
            igte_apds[lc] += _safe_int(r.get('APDs', 0))

    def build_rows(apds_map, slots_map):
        all_lcs = set(apds_map) | set(slots_map)
        rows = []
        for lc in all_lcs:
            apds = apds_map.get(lc, 0)
            slots = slots_map.get(lc, 0)
            rate = round((apds / slots) * 100, 1) if slots > 0 else 0.0
            rows.append({'lc': lc, 'apds': apds, 'slots': slots, 'fulfillment_rate': rate})
        return sorted(rows, key=lambda x: x['fulfillment_rate'], reverse=True)

    return Response({
        'igv': build_rows(igv_apds, igv_slots),
        'igte': build_rows(igte_apds, igte_slots),
    })
