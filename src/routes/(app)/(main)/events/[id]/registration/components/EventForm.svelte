<script lang="ts">
	import {
		createRegistrationField,
		deleteRegistrationField as deleteFieldApi,
		getRegistrationFields,
		getTicketTypes,
		reorderRegistrationFields,
		updateRegistrationField as updateFieldApi,
		updateRegistrationFormSettings
	} from '$lib/services/event.services';
	import { clickOutside } from '$lib/utils/constant';
	import Icon from '@iconify/svelte';
	import { onMount } from 'svelte';
	import QuestionTypeList from './modal/QuestionTypeList.svelte';
	import CheckboxQuestionModal from './modal/questionModal/CheckboxQuestionModal.svelte';
	import CompanyQuestionModal from './modal/questionModal/CompanyQuestionModal.svelte';
	import OptionsQuestionModal from './modal/questionModal/OptionsQuestionModal.svelte';
	import SocialProfileQuestionModal from './modal/questionModal/SocialProfileQuestionModal.svelte';
	import TermsQuestionModal from './modal/questionModal/TermsQuestionModal.svelte';
	import TextQuestionModal from './modal/questionModal/TextQuestionModal.svelte';
	import WebsiteQuestionModal from './modal/questionModal/WebsiteQuestionModal.svelte';

	export let eventId: string;
	export let eventData: any;

	let customQuestions: any[] = [];
	let tickets: any[] = [];
	let loading = true;

	// Edit modal state
	let editingQuestion: any = null;
	let showEditTextModal = false;
	let showEditCheckboxModal = false;
	let showEditOptionsModal = false;
	let showEditSocialModal = false;
	let showEditWebsiteModal = false;
	let showEditCompanyModal = false;
	let showEditTermsModal = false;

	// Edit modal data (pre-populated for each type)
	let editTextData: any = {};
	let editCheckboxData: any = {};
	let editOptionsData: any = {};
	let editSocialData: any = {};
	let editWebsiteData: any = {};
	let editCompanyData: any = {};
	let editTermsData: any = {};

	// Ticket names for modals
	$: ticketNames = tickets.map((t: any) => t.name);

	// Drag and drop state
	let dragIndex: number | null = null;
	let dragOverIndex: number | null = null;
	let reordering = false;

	// Personal info settings from event
	$: phoneEnabled = eventData?.registrationFormSettings?.phoneEnabled ?? 'OFF';
	$: ethAddressEnabled = eventData?.registrationFormSettings?.ethAddressEnabled ?? 'OFF';
	$: solAddressEnabled = eventData?.registrationFormSettings?.solAddressEnabled ?? 'OFF';

	let menuOpen: number | null = null;
	let showAddQuestion = false;
	let options = ['Off', 'Optional', 'Required'];

	// Map UI option labels to API values
	function optionToApiValue(opt: string): 'OFF' | 'OPTIONAL' | 'REQUIRED' {
		if (opt === 'Required') return 'REQUIRED';
		if (opt === 'Optional') return 'OPTIONAL';
		return 'OFF';
	}

	function apiValueToOption(val: string): string {
		if (val === 'REQUIRED') return 'Required';
		if (val === 'OPTIONAL') return 'Optional';
		return 'Off';
	}

	// Personal information questions (static structure, dynamic settings)
	const nameIcon = `<svg width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path opacity="0.4" d="M7.13613 0C4.48037 0 2.32129 2.15908 2.32129 4.81484C2.32129 7.41993 4.35873 9.52832 7.01449 9.61955C7.09559 9.60942 7.17668 9.60942 7.2375 9.61955C7.25777 9.61955 7.26791 9.61955 7.28818 9.61955C7.29832 9.61955 7.29832 9.61955 7.30845 9.61955C9.9034 9.52832 11.9408 7.41993 11.951 4.81484C11.951 2.15908 9.7919 0 7.13613 0Z" fill="#CECECF"/><path d="M12.2855 9.27342C9.45737 7.38803 4.84525 7.38803 1.99689 9.27342C0.709556 10.135 0 11.3007 0 12.5475C0 13.7943 0.709556 14.9499 1.98676 15.8013C3.40587 16.7542 5.27099 17.2306 7.13611 17.2306C9.00122 17.2306 10.8663 16.7542 12.2855 15.8013C13.5627 14.9397 14.2722 13.7842 14.2722 12.5272C14.2621 11.2804 13.5627 10.1249 12.2855 9.27342Z" fill="#CECECF"/></svg>`;
	const emailIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.74258 16.4844H11.2379C14.984 16.4844 16.4824 14.986 16.4824 11.2399V6.74454C16.4824 2.99844 14.984 1.5 11.2379 1.5H6.74258C2.99649 1.5 1.49805 2.99844 1.49805 6.74454V11.2399C1.49805 14.986 2.99649 16.4844 6.74258 16.4844Z" fill="#CECECF" stroke="#CECECF" stroke-width="1.12383" stroke-linecap="round" stroke-linejoin="round"/><g opacity="0.4"><path d="M1.49805 9.74187H4.31511C4.88452 9.74187 5.40148 10.064 5.65622 10.5735L6.32302 11.9146C6.74258 12.7387 7.4918 12.7387 7.67162 12.7387H10.3164C10.8858 12.7387 11.4027 12.4166 11.6575 11.9071L12.3243 10.566C12.579 10.0565 13.096 9.73438 13.6654 9.73438H16.4675" fill="#CECECF"/><path d="M1.49805 9.74187H4.31511C4.88452 9.74187 5.40148 10.064 5.65622 10.5735L6.32302 11.9146C6.74258 12.7387 7.4918 12.7387 7.67162 12.7387H10.3164C10.8858 12.7387 11.4027 12.4166 11.6575 11.9071L12.3243 10.566C12.579 10.0565 13.096 9.73438 13.6654 9.73438H16.4675" stroke="#FDFDFD" stroke-width="2.24766" stroke-linecap="round" stroke-linejoin="round"/></g></svg>`;
	const phoneIcon = `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.1675 1.50781H5.81414C3.74629 1.50781 2.99707 2.25703 2.99707 4.36234V13.6377C2.99707 15.743 3.74629 16.4922 5.81414 16.4922H12.16C14.2354 16.4922 14.9846 15.743 14.9846 13.6377V4.36234C14.9846 2.25703 14.2354 1.50781 12.1675 1.50781ZM8.99083 14.4693C8.27158 14.4693 7.67969 13.8774 7.67969 13.1582C7.67969 12.4389 8.27158 11.847 8.99083 11.847C9.71008 11.847 10.302 12.4389 10.302 13.1582C10.302 13.8774 9.71008 14.4693 8.99083 14.4693ZM10.4893 4.692H7.49239C7.18521 4.692 6.93047 4.43726 6.93047 4.13008C6.93047 3.8229 7.18521 3.56817 7.49239 3.56817H10.4893C10.7964 3.56817 11.0512 3.8229 11.0512 4.13008C11.0512 4.43726 10.7964 4.692 10.4893 4.692Z" fill="#CECECF"/></svg>`;
	const ethIcon = `<svg width="12" height="16" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5.61883 8.24548L0.215459 7.86648L5.61803 5.36912V8.24548H5.61883ZM5.61883 11.175V15.7336C3.73999 13.344 1.66901 10.7139 0 8.58508C1.96969 9.49153 4.0262 10.4387 5.61883 11.175ZM5.61883 4.56185L0 7.12358L5.61883 0V4.56185Z" fill="#CECECF"/><path d="M11.0225 7.86648L5.61914 8.24548V5.36912L11.0225 7.86648ZM5.61914 11.1757C7.21097 10.44 9.26668 9.49153 11.2372 8.58507C9.56816 10.7146 7.49718 13.3446 5.61914 15.733V11.1757ZM5.61914 4.56185V0L11.2372 7.12358L5.61914 4.56185Z" fill="#CECECF"/><path opacity="0.2" fill-rule="evenodd" clip-rule="evenodd" d="M5.61914 8.24619L11.0217 7.86719L5.61914 10.3468V8.24619Z" fill="#CECECF"/><path opacity="0.603" fill-rule="evenodd" clip-rule="evenodd" d="M5.61724 8.24619L0.213867 7.86719L5.61724 10.3468V8.24619Z" fill="#CECECF"/></svg>`;
	const solIcon = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.6526 12.4048L13.0553 15.5193C12.9988 15.587 12.9305 15.6409 12.8546 15.6778C12.7787 15.7147 12.6968 15.7337 12.614 15.7336H0.301529C0.242779 15.7336 0.185309 15.7144 0.136182 15.6784C0.0870534 15.6424 0.0484065 15.5911 0.0249893 15.5308C0.00157216 15.4706 -0.00559526 15.404 0.00436774 15.3393C0.0143307 15.2745 0.0409901 15.2145 0.0810704 15.1664L2.68034 12.0519C2.73665 11.9845 2.80474 11.9306 2.8804 11.8938C2.95608 11.8569 3.03771 11.8378 3.12025 11.8377H15.4321C15.4908 11.8377 15.5483 11.8569 15.5974 11.8929C15.6465 11.9289 15.6852 11.9802 15.7087 12.0404C15.732 12.1007 15.7392 12.1672 15.7292 12.232C15.7193 12.2967 15.6926 12.3568 15.6526 12.4048ZM13.0553 6.1331C12.9988 6.06545 12.9305 6.01151 12.8546 5.97464C12.7787 5.93779 12.6968 5.91879 12.614 5.91884H0.301529C0.242779 5.91884 0.185309 5.93803 0.136182 5.97405C0.0870534 6.01008 0.0484065 6.06136 0.0249893 6.12159C0.00157216 6.18184 -0.00559526 6.24843 0.00436774 6.31317C0.0143307 6.37789 0.0409901 6.43796 0.0810704 6.486L2.68034 9.60051C2.73665 9.66798 2.80474 9.7218 2.8804 9.75867C2.95608 9.79551 3.03771 9.81463 3.12025 9.81477H15.4321C15.4908 9.81477 15.5483 9.79559 15.5974 9.75956C15.6465 9.72353 15.6852 9.67226 15.7087 9.61202C15.732 9.55177 15.7392 9.48519 15.7292 9.42045C15.7193 9.35572 15.6926 9.29565 15.6526 9.24761L13.0553 6.1331ZM0.301529 3.89595H12.614C12.6968 3.89598 12.7787 3.87699 12.8546 3.84013C12.9305 3.80326 12.9988 3.74932 13.0553 3.68166L15.6526 0.567159C15.6926 0.519132 15.7193 0.45906 15.7292 0.394324C15.7392 0.329587 15.732 0.263007 15.7087 0.202763C15.6852 0.14252 15.6465 0.0912363 15.5974 0.0552148C15.5483 0.019193 15.4908 2.21833e-06 15.4321 0H3.12025C3.03771 0.00015705 2.95608 0.0192556 2.8804 0.0561132C2.80474 0.092971 2.73665 0.146803 2.68034 0.214277L0.0817404 3.32879C0.0416989 3.37675 0.0150513 3.43678 0.00506567 3.50143C-0.00491993 3.56609 0.00219062 3.63262 0.0255252 3.69284C0.0488598 3.75306 0.0874042 3.80433 0.136431 3.84041C0.185459 3.87649 0.242836 3.89579 0.301529 3.89595Z" fill="#CECECF"/></svg>`;

	// Ticket color helpers for display
	const ticketColors = [
		{ bg: 'bg-[#F4E1D5]', text: 'text-[#D79813]' },
		{ bg: 'bg-[#E3F4E1]', text: 'text-[#3CBD2C]' },
		{ bg: 'bg-[#E9DAE4]', text: 'text-[#94748D]' },
		{ bg: 'bg-[#E2E8FC]', text: 'text-[#146AEB]' }
	];

	function getTicketColor(index: number) {
		return ticketColors[index % ticketColors.length];
	}

	function getQuestionIcon(fieldType: string): string {
		const iconMap: Record<string, string> = {
			TEXT: '/text-icon.svg',
			SHORT_TEXT: '/text-icon.svg',
			LONG_TEXT: '/text-icon.svg',
			CHECKBOX: '/checkbox-icon.svg',
			OPTIONS: '/option-icon.svg',
			MULTI_SELECT: '/option-icon.svg',
			SOCIAL_PROFILE: '/user-octagon.svg',
			WEBSITE: '/link-2.svg',
			COMPANY: '/buildings-2.svg',
			TERMS_CHECKBOX: '/terms-icon.svg',
			UPLOAD: '/link-2.svg'
		};
		return iconMap[fieldType] ?? '/text-icon.svg';
	}

	function getQuestionTypeLabel(field: any): string {
		const labelMap: Record<string, string> = {
			TEXT: field.responseLength === 'multi-line' ? 'Long Text' : 'Text',
			SHORT_TEXT: 'Text',
			LONG_TEXT: 'Long Text',
			CHECKBOX: 'Checkbox',
			OPTIONS: field.selectionType === 'multiple' ? 'Multi Select' : 'Options',
			MULTI_SELECT: 'Multi Select',
			SOCIAL_PROFILE: field.platform ?? 'Social Profile',
			WEBSITE: 'Website',
			COMPANY: 'Company',
			TERMS_CHECKBOX: 'Terms',
			UPLOAD: 'Upload'
		};
		return labelMap[field.fieldType] ?? field.fieldType;
	}

	function getTicketNames(ticketTypeIds: string[]): string[] {
		if (!ticketTypeIds?.length) return [];
		return ticketTypeIds
			.map((id: string) => {
				const t = tickets.find((tk: any) => tk.id === id);
				return t?.name ?? '';
			})
			.filter(Boolean);
	}

	onMount(async () => {
		try {
			const [fields, ticketList] = await Promise.all([
				getRegistrationFields(eventId),
				getTicketTypes(eventId).catch(() => [])
			]);
			customQuestions = fields;
			tickets = ticketList;
		} catch (e: any) {
			console.error('Failed to load registration fields:', e.message);
		} finally {
			loading = false;
		}
	});

	async function handleFormSettingChange(field: string, value: string) {
		const apiValue = optionToApiValue(value);
		try {
			const settings: any = {};
			settings[field] = apiValue;
			await updateRegistrationFormSettings(eventId, settings);
			if (field === 'phoneEnabled') phoneEnabled = apiValue;
			else if (field === 'ethAddressEnabled') ethAddressEnabled = apiValue;
			else if (field === 'solAddressEnabled') solAddressEnabled = apiValue;
			if (eventData) {
				if (!eventData.registrationFormSettings) eventData.registrationFormSettings = {};
				eventData.registrationFormSettings[field] = apiValue;
			}
			menuOpen = null;
		} catch (e: any) {
			console.error('Failed to update form setting:', e.message);
		}
	}

	async function handleAddCustomQuestion(e: CustomEvent) {
		const data = e.detail;
		try {
			const payload = mapQuestionDataToPayload(data);
			const created = await createRegistrationField(eventId, payload);
			customQuestions = [...customQuestions, created];
		} catch (e: any) {
			console.error('Failed to create question:', e.message);
		}
	}

	async function handleDeleteCustomQuestion(fieldId: string) {
		try {
			await deleteFieldApi(eventId, fieldId);
			customQuestions = customQuestions.filter((q: any) => q.id !== fieldId);
		} catch (e: any) {
			console.error('Failed to delete question:', e.message);
		}
	}

	// Helper: resolve ticket IDs back to ticket names (modals work with names)
	function resolveTicketIdsToNames(ticketTypeIds: string[]): string[] {
		if (!ticketTypeIds?.length) return [];
		return ticketTypeIds
			.map((id: string) => {
				const t = tickets.find((tk: any) => tk.id === id);
				return t?.name ?? '';
			})
			.filter(Boolean);
	}

	// Helper: resolve ticket names back to IDs for API
	function resolveTicketNamesToIds(names: string[]): string[] {
		if (!names?.length) return [];
		return names
			.map((name: string) => {
				const t = tickets.find((tk: any) => tk.name === name);
				return t?.id ?? '';
			})
			.filter(Boolean);
	}

	// Open the correct type-specific modal for editing
	function startEditing(question: any) {
		editingQuestion = question;
		const ticketNamesList = resolveTicketIdsToNames(question.ticketTypeIds ?? []);

		switch (question.fieldType) {
			case 'TEXT':
			case 'SHORT_TEXT':
			case 'LONG_TEXT':
				editTextData = {
					id: question.id,
					type: 'text',
					question: question.fieldName,
					responseLength: question.responseLength ?? 'short',
					isRequired: question.isRequired ?? false,
					helpText: 'Ask for a free-form response',
					ticketIds: ticketNamesList,
					ticketOptions: ticketNames
				};
				showEditTextModal = true;
				break;
			case 'CHECKBOX':
				editCheckboxData = {
					id: question.id,
					type: 'checkbox',
					question: question.fieldName,
					isRequired: question.isRequired ?? false,
					helpText: 'When set to Required, guests must check the box to proceed.',
					ticketIds: ticketNamesList,
					ticketOptions: ticketNames
				};
				showEditCheckboxModal = true;
				break;
			case 'OPTIONS':
			case 'MULTI_SELECT':
				editOptionsData = {
					id: question.id,
					type: 'options',
					question: question.fieldName,
					options: [...(question.options ?? [])],
					selectionType: question.selectionType ?? 'single',
					isRequired: question.isRequired ?? false,
					helpText: 'Press Enter or Tab key to add a new option.',
					ticketIds: ticketNamesList,
					ticketOptions: ticketNames
				};
				showEditOptionsModal = true;
				break;
			case 'SOCIAL_PROFILE':
				editSocialData = {
					id: question.id,
					type: 'social',
					platform: question.platform ?? 'instagram',
					question: question.fieldName,
					isRequired: question.isRequired ?? false,
					helpText: "We'll automatically get this information from their profile if available",
					ticketIds: ticketNamesList,
					ticketOptions: ticketNames
				};
				showEditSocialModal = true;
				break;
			case 'WEBSITE':
				editWebsiteData = {
					id: question.id,
					type: 'website',
					question: question.fieldName,
					isRequired: question.isRequired ?? false,
					helpText: "We'll automatically get this information from their profile if available",
					ticketIds: ticketNamesList,
					ticketOptions: ticketNames
				};
				showEditWebsiteModal = true;
				break;
			case 'COMPANY':
				editCompanyData = {
					question: question.fieldName,
					isRequired: question.isRequired ?? false,
					helpText: "We'll automatically get this information from their profile if available",
					ticketIds: ticketNamesList,
					ticketOptions: ticketNames
				};
				showEditCompanyModal = true;
				break;
			case 'TERMS_CHECKBOX':
				editTermsData = {
					contentType: question.contentType ?? 'text',
					termsContent: question.termsContent ?? '',
					termsLink: question.termsLink ?? '',
					collectSignature: question.collectSignature ?? false,
					helpText: 'Guests will type their signature to agree',
					ticketIds: ticketNamesList,
					ticketOptions: ticketNames
				};
				showEditTermsModal = true;
				break;
			default:
				// Fallback to text modal
				editTextData = {
					id: question.id,
					type: 'text',
					question: question.fieldName,
					responseLength: 'short',
					isRequired: question.isRequired ?? false,
					helpText: 'Ask for a free-form response',
					ticketIds: ticketNamesList,
					ticketOptions: ticketNames
				};
				showEditTextModal = true;
		}
	}

	// Handle save from any edit modal
	async function handleSaveEditedQuestion(e: CustomEvent) {
		if (!editingQuestion) return;
		const questionId = editingQuestion.id;
		const data = e.detail;
		try {
			const payload = mapQuestionDataToPayload(data);
			// Resolve ticket names back to IDs
			payload.ticketTypeIds = resolveTicketNamesToIds(data.ticketIds ?? []);
			const updated = await updateFieldApi(eventId, questionId, payload);
			customQuestions = customQuestions.map((q: any) =>
				q.id === questionId ? { ...q, ...updated } : q
			);
		} catch (err: any) {
			console.error('Failed to update question:', err.message);
			// Reload from server to stay in sync
			try {
				const fields = await getRegistrationFields(eventId);
				customQuestions = fields;
			} catch (_) {}
		} finally {
			closeEditModals();
		}
	}

	// Close all edit modals
	function closeEditModals() {
		showEditTextModal = false;
		showEditCheckboxModal = false;
		showEditOptionsModal = false;
		showEditSocialModal = false;
		showEditWebsiteModal = false;
		showEditCompanyModal = false;
		showEditTermsModal = false;
		editingQuestion = null;
	}

	// Drag and drop handlers
	function handleDragStart(index: number) {
		dragIndex = index;
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		dragOverIndex = index;
	}

	function handleDragLeave() {
		dragOverIndex = null;
	}

	async function handleDrop(e: DragEvent, dropIndex: number) {
		e.preventDefault();
		dragOverIndex = null;
		if (dragIndex === null || dragIndex === dropIndex) {
			dragIndex = null;
			return;
		}

		// Reorder locally first for instant feedback
		const items = [...customQuestions];
		const [moved] = items.splice(dragIndex, 1);
		items.splice(dropIndex, 0, moved);
		// Update local order values so they match the new positions
		customQuestions = items.map((q: any, i: number) => ({ ...q, order: i + 1 }));
		dragIndex = null;

		// Persist to backend
		reordering = true;
		try {
			const fieldOrders = customQuestions.map((q: any, i: number) => ({
				fieldId: q.id,
				order: i + 1
			}));
			await reorderRegistrationFields(eventId, fieldOrders);
		} catch (e: any) {
			console.error('Failed to reorder questions:', e.message);
			// Reload from server on failure to stay in sync
			try {
				const fields = await getRegistrationFields(eventId);
				customQuestions = fields;
			} catch (_) {}
		} finally {
			reordering = false;
		}
	}

	function handleDragEnd() {
		dragIndex = null;
		dragOverIndex = null;
	}

	function mapQuestionDataToPayload(data: any): any {
		const base: any = {
			fieldName: data.question || data.fieldName || '',
			isRequired: data.isRequired ?? false,
			ticketTypeIds: data.ticketIds ?? []
		};

		// Determine the type - modals use different field names
		const type = data.type || data.fieldType || '';

		switch (type) {
			case 'text':
				base.fieldType = 'TEXT';
				base.responseLength = data.responseLength ?? 'short';
				break;
			case 'checkbox':
				base.fieldType = 'CHECKBOX';
				break;
			case 'options':
				base.fieldType = 'OPTIONS';
				base.options = data.options ?? [];
				base.selectionType = data.selectionType ?? 'single';
				break;
			case 'social':
				base.fieldType = 'SOCIAL_PROFILE';
				base.platform = data.platform ?? '';
				break;
			case 'website':
				base.fieldType = 'WEBSITE';
				break;
			case 'company':
				base.fieldType = 'COMPANY';
				break;
			case 'terms':
				base.fieldType = 'TERMS_CHECKBOX';
				base.contentType = data.contentType ?? 'text';
				base.termsContent = data.termsContent ?? '';
				base.termsLink = data.termsLink ?? '';
				base.collectSignature = data.collectSignature ?? false;
				break;
			default:
				// Company and Terms modals don't set a 'type' field - detect by data shape
				if (data.contentType !== undefined || data.termsContent !== undefined || data.collectSignature !== undefined) {
					base.fieldType = 'TERMS_CHECKBOX';
					base.contentType = data.contentType ?? 'text';
					base.termsContent = data.termsContent ?? '';
					base.termsLink = data.termsLink ?? '';
					base.collectSignature = data.collectSignature ?? false;
				} else if (data.helpText?.includes('company') || data.helpText?.includes('profile if available')) {
					base.fieldType = 'COMPANY';
				} else {
					base.fieldType = 'TEXT';
				}
		}

		return base;
	}

	// Ticket filter for custom questions
	let selectedTicketFilter = 'all';
	$: filteredQuestions =
		selectedTicketFilter === 'all'
			? customQuestions
			: customQuestions.filter(
					(q: any) =>
						!q.ticketTypeIds?.length || q.ticketTypeIds.includes(selectedTicketFilter)
				);
</script>

<div class="">
	<!-- Registration Questions Section -->
	<div class="mb-6">
		<h2 class="mb-1 text-lg font-semibold">Registration Questions</h2>
		<p class="mb-4 text-sm text-[#8C8F93]">
			We will ask attendees the following questions when they register for the event.
		</p>

		<!-- Personal Information Section -->
		<div class="my-4">
			<div class="mb-3 flex items-center gap-2">
				<img src="/pi-icon.svg" alt="" />
				<h3 class="text-sm font-medium">Personal Information</h3>
			</div>

			<div class="mb-6 flex w-full flex-wrap gap-3">
				<!-- Name - Always Required -->
				<div class="relative flex w-full items-center gap-2 rounded-[8px] bg-[#FDFDFD] px-4 py-3 text-sm font-medium shadow-sm sm:min-w-55 md:w-fit">
					<div class="flex w-full items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<p>{@html nameIcon}</p>
							<span class="font-medium">Name</span>
						</div>
						<span class="text-xs text-gray-500">Required</span>
					</div>
				</div>

				<!-- Email - Always Required -->
				<div class="relative flex w-full items-center gap-2 rounded-[8px] bg-[#FDFDFD] px-4 py-3 text-sm font-medium shadow-sm sm:min-w-55 md:w-fit">
					<div class="flex w-full items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<p>{@html emailIcon}</p>
							<span class="font-medium">Email</span>
						</div>
						<span class="text-xs text-gray-500">Required</span>
					</div>
				</div>

				<!-- Phone - Toggleable -->
				<div
					use:clickOutside={() => { if (menuOpen === 3) menuOpen = null; }}
					class="relative flex w-full items-center gap-2 rounded-[8px] bg-[#FDFDFD] px-4 py-3 text-sm font-medium shadow-sm sm:min-w-55 md:w-fit"
				>
					<div class="flex w-full items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<p>{@html phoneIcon}</p>
							<span class="font-medium">Phone</span>
						</div>
						<div>
							<button
								on:click={() => (menuOpen = menuOpen === 3 ? null : 3)}
								class="flex items-center gap-1"
							>
								<span class="text-xs text-gray-500">{apiValueToOption(phoneEnabled)}</span>
								<img src="/up-down-icon.svg" alt="" class="h-4 w-4" />
							</button>
							{#if menuOpen === 3}
								<div class="triangle absolute top-13 left-0 z-10 mt-1 w-full rounded-md border border-gray-200 bg-white p-2 shadow-lg">
									{#each options as option}
										<button
											class="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 {option === apiValueToOption(phoneEnabled) ? 'bg-[#F0F0F0]' : ''}"
											on:click={() => handleFormSettingChange('phoneEnabled', option)}
										>
											<span>{option}</span>
											{#if option === apiValueToOption(phoneEnabled)}
												<Icon icon="mdi:tick" class="h-4 w-4 text-black" />
											{/if}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Web3 Identity Section -->
		<div class="mb-4">
			<div class="mb-3 flex items-center gap-2">
				<img src="/web-3-icon.svg" alt="" />
				<h3 class="font-medium">Web3 Identity</h3>
			</div>

			<div class="mb-6 flex w-full flex-wrap gap-3">
				<!-- ETH Address -->
				<div
					use:clickOutside={() => { if (menuOpen === 4) menuOpen = null; }}
					class="relative flex w-full items-center gap-2 rounded-[8px] bg-[#FDFDFD] px-4 py-3 text-sm font-medium shadow-sm sm:min-w-55 md:w-fit"
				>
					<div class="flex w-full items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<p>{@html ethIcon}</p>
							<span class="font-medium">Eth Address</span>
						</div>
						<div>
							<button
								on:click={() => (menuOpen = menuOpen === 4 ? null : 4)}
								class="flex items-center gap-1"
							>
								<span class="text-xs text-gray-500">{apiValueToOption(ethAddressEnabled)}</span>
								<img src="/up-down-icon.svg" alt="" class="h-4 w-4" />
							</button>
							{#if menuOpen === 4}
								<div class="triangle absolute top-13 left-0 z-10 mt-1 w-full rounded-md border border-gray-200 bg-white p-2 shadow-lg">
									{#each options as option}
										<button
											class="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 {option === apiValueToOption(ethAddressEnabled) ? 'bg-[#F0F0F0]' : ''}"
											on:click={() => handleFormSettingChange('ethAddressEnabled', option)}
										>
											<span>{option}</span>
											{#if option === apiValueToOption(ethAddressEnabled)}
												<Icon icon="mdi:tick" class="h-4 w-4 text-black" />
											{/if}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- SOL Address -->
				<div
					use:clickOutside={() => { if (menuOpen === 5) menuOpen = null; }}
					class="relative flex w-full items-center gap-2 rounded-[8px] bg-[#FDFDFD] px-4 py-3 text-sm font-medium shadow-sm sm:min-w-55 md:w-fit"
				>
					<div class="flex w-full items-center justify-between gap-2">
						<div class="flex items-center gap-2">
							<p>{@html solIcon}</p>
							<span class="font-medium">SOL Address</span>
						</div>
						<div>
							<button
								on:click={() => (menuOpen = menuOpen === 5 ? null : 5)}
								class="flex items-center gap-1"
							>
								<span class="text-xs text-gray-500">{apiValueToOption(solAddressEnabled)}</span>
								<img src="/up-down-icon.svg" alt="" class="h-4 w-4" />
							</button>
							{#if menuOpen === 5}
								<div class="triangle absolute top-13 left-0 z-10 mt-1 w-full rounded-md border border-gray-200 bg-white p-2 shadow-lg">
									{#each options as option}
										<button
											class="flex w-full cursor-pointer items-center justify-between px-3 py-1.5 {option === apiValueToOption(solAddressEnabled) ? 'bg-[#F0F0F0]' : ''}"
											on:click={() => handleFormSettingChange('solAddressEnabled', option)}
										>
											<span>{option}</span>
											{#if option === apiValueToOption(solAddressEnabled)}
												<Icon icon="mdi:tick" class="h-4 w-4 text-black" />
											{/if}
										</button>
									{/each}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Custom Questions Section -->
		<div class="">
			<div class="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
				<div class="flex items-center gap-2">
					<img src="/cq-icon.svg" alt="" />
					<h3 class="font-medium">Custom Questions</h3>
				</div>
				<div class="flex items-center gap-2">
					<div use:clickOutside={() => { if (menuOpen === 100) menuOpen = null; }} class="relative">
						<button
							on:click={() => (menuOpen = menuOpen === 100 ? null : 100)}
							class="flex flex-shrink-0 cursor-pointer items-center gap-2 rounded-md bg-[#EBECED] px-3 py-2 text-xs text-[#616265] md:text-sm"
						>
							<img src="/filter-edit.svg" alt="filter icon" class="h-5 w-5" />
							{selectedTicketFilter === 'all' ? 'All Tickets' : tickets.find((t) => t.id === selectedTicketFilter)?.name ?? 'All Tickets'}
							<img src="/arrow-down.svg" alt="Arrow Down" class="h-2 w-3" />
						</button>
						{#if menuOpen === 100}
							<div class="absolute right-0 z-10 mt-1 w-48 rounded-md border border-gray-200 bg-white p-2 shadow-lg">
								<button
									on:click={() => { selectedTicketFilter = 'all'; menuOpen = null; }}
									class="flex w-full items-center justify-between rounded-sm px-3 py-1.5 {selectedTicketFilter === 'all' ? 'bg-[#F0F0F0]' : ''}"
								>
									<span>All Tickets</span>
									{#if selectedTicketFilter === 'all'}
										<Icon icon="mdi:tick" class="h-4 w-4 text-black" />
									{/if}
								</button>
								{#each tickets as ticket}
									<button
										on:click={() => { selectedTicketFilter = ticket.id; menuOpen = null; }}
										class="flex w-full items-center justify-between rounded-sm px-3 py-1.5 {selectedTicketFilter === ticket.id ? 'bg-[#F0F0F0]' : ''}"
									>
										<span class="truncate">{ticket.name}</span>
										{#if selectedTicketFilter === ticket.id}
											<Icon icon="mdi:tick" class="h-4 w-4 text-black" />
										{/if}
									</button>
								{/each}
							</div>
						{/if}
					</div>
					<div use:clickOutside={() => (showAddQuestion = false)}>
						<button
							on:click={() => (showAddQuestion = !showAddQuestion)}
							class="flex w-fit items-center gap-1 rounded-md bg-[#EBECED] px-3 py-2 text-xs font-medium text-[#616265] transition-colors hover:bg-gray-200 md:text-sm"
						>
							<Icon icon="mdi:plus" class="text-xl" />
							Add Question
						</button>
						<QuestionTypeList
							bind:open={showAddQuestion}
							{eventId}
							{tickets}
							on:questionAdded={handleAddCustomQuestion}
						/>
					</div>
				</div>
			</div>

			{#if loading}
				<div class="flex flex-col gap-3 animate-pulse">
					{#each [1, 2] as _}
						<div class="rounded-xl bg-[#FDFDFD] p-4">
							<div class="h-5 w-48 rounded bg-gray-200 mb-2"></div>
							<div class="h-4 w-32 rounded bg-gray-200"></div>
						</div>
					{/each}
				</div>
			{:else if filteredQuestions.length > 0}
				<div class="flex flex-col gap-3">
					{#each filteredQuestions as question, idx (question.id)}
						<div
							class="rounded-xl bg-[#FDFDFD] p-4 transition-all {dragOverIndex === idx ? 'border-2 border-dashed border-purple-300' : 'border-2 border-transparent'} {dragIndex === idx ? 'opacity-40' : ''}"
							draggable="true"
							on:dragstart={() => handleDragStart(idx)}
							on:dragover={(e) => handleDragOver(e, idx)}
							on:dragleave={handleDragLeave}
							on:drop={(e) => handleDrop(e, idx)}
							on:dragend={handleDragEnd}
							role="listitem"
						>
							<div class="flex items-center justify-between gap-2">
								<div class="flex items-center gap-2">
									<!-- 6-dot drag handle -->
									<button class="cursor-grab active:cursor-grabbing flex-shrink-0" aria-label="Drag to reorder">
										<svg width="10" height="16" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg">
											<circle cx="2" cy="2" r="1.5" fill="#C4C4C4"/>
											<circle cx="8" cy="2" r="1.5" fill="#C4C4C4"/>
											<circle cx="2" cy="8" r="1.5" fill="#C4C4C4"/>
											<circle cx="8" cy="8" r="1.5" fill="#C4C4C4"/>
											<circle cx="2" cy="14" r="1.5" fill="#C4C4C4"/>
											<circle cx="8" cy="14" r="1.5" fill="#C4C4C4"/>
										</svg>
									</button>
									<div class="w-fit md:w-auto">
										<span class="mb-1 font-medium">{question.fieldName}</span>
										<div class="flex flex-col gap-2 lg:flex-row lg:items-center">
											<span class="flex items-center gap-1 text-sm text-[#B3B4B4]">
												<img src={getQuestionIcon(question.fieldType)} alt="" />
												{getQuestionTypeLabel(question)}
												{question.isRequired ? '- Required' : ''}
											</span>
											{#if question.ticketTypeIds?.length}
												<div class="mt-1 mb-3 flex flex-wrap items-center gap-2">
													{#each getTicketNames(question.ticketTypeIds) as name, i}
														<span
															class="max-w-[100px] truncate rounded-2xl px-2 py-0.5 text-xs font-medium {getTicketColor(i).bg} {getTicketColor(i).text}"
														>
															{name}
														</span>
													{/each}
												</div>
											{/if}
										</div>
										{#if question.fieldType === 'OPTIONS' && question.options?.length}
											<span class="text-sm text-[#B3B4B4]">
												{question.options.length} Options: {question.options.join(', ')}
											</span>
										{/if}
									</div>
								</div>
								<div class="flex items-center gap-2 self-start">
									<button on:click={() => handleDeleteCustomQuestion(question.id)} title="Delete question">
										<img src="/delete-icon.svg" alt="delete" class="h-[18px] w-[18px]" />
									</button>
									<button on:click={() => startEditing(question)} title="Edit question">
										<img src="/edit.svg" alt="edit" class="h-[15px] w-[15px]" />
									</button>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex h-30 flex-col items-center justify-center">
					<p class="text-sm text-gray-400">No custom questions added yet</p>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- Edit Modals (type-specific) -->
<TextQuestionModal
	bind:open={showEditTextModal}
	isEditing={true}
	ticketOptions={ticketNames}
	questionData={editTextData}
	on:save={handleSaveEditedQuestion}
	on:close={closeEditModals}
	on:return={closeEditModals}
/>

<CheckboxQuestionModal
	bind:open={showEditCheckboxModal}
	isEditing={true}
	ticketOptions={ticketNames}
	questionData={editCheckboxData}
	on:save={handleSaveEditedQuestion}
	on:close={closeEditModals}
	on:return={closeEditModals}
/>

<OptionsQuestionModal
	bind:open={showEditOptionsModal}
	isEditing={true}
	ticketOptions={ticketNames}
	questionData={editOptionsData}
	on:save={handleSaveEditedQuestion}
	on:close={closeEditModals}
	on:return={closeEditModals}
/>

<SocialProfileQuestionModal
	bind:open={showEditSocialModal}
	isEditing={true}
	ticketOptions={ticketNames}
	questionData={editSocialData}
	on:save={handleSaveEditedQuestion}
	on:close={closeEditModals}
	on:return={closeEditModals}
/>

<WebsiteQuestionModal
	bind:open={showEditWebsiteModal}
	isEditing={true}
	ticketOptions={ticketNames}
	questionData={editWebsiteData}
	on:save={handleSaveEditedQuestion}
	on:close={closeEditModals}
	on:return={closeEditModals}
/>

<CompanyQuestionModal
	bind:open={showEditCompanyModal}
	isEditing={true}
	questionData={editCompanyData}
	on:save={handleSaveEditedQuestion}
	on:close={closeEditModals}
	on:return={closeEditModals}
/>

<TermsQuestionModal
	bind:open={showEditTermsModal}
	isEditing={true}
	questionData={editTermsData}
	on:save={handleSaveEditedQuestion}
	on:close={closeEditModals}
	on:return={closeEditModals}
/>

<style>
	.triangle::before {
		content: '';
		position: absolute;
		top: -18px;
		left: 90px;
		border-width: 8px;
		border-style: solid;
		border-color: transparent transparent white transparent;
	}
</style>
